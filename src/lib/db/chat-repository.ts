import { demoSessions } from "@/lib/chat/demo-data";
import type { ChatMessage, ChatSession, StatusKind } from "@/lib/chat/types";
import type { CandidateProfile } from "@/lib/profile/types";
import { getDbPool, hasDatabaseConnection } from "./client";

type FallbackSessionRecord = {
  session: ChatSession;
  messages: ChatMessage[];
  profile: CandidateProfile | null;
};

const fallbackStores = new Map<string, FallbackSessionRecord[]>();

export type PersistChatTurnInput = {
  userId: string;
  sessionId?: string;
  userMessage: string;
  assistantMessage: ChatMessage;
  profile?: CandidateProfile;
};

export type PersistCandidateProfileForSessionInput = {
  userId: string;
  sessionId: string;
  profile: CandidateProfile;
};

export async function createChatSessionForUser(userId: string): Promise<ChatSession> {
  if (!hasDatabaseConnection()) {
    const session = createFallbackSession();
    getFallbackStoreForUser(userId).unshift({
      session,
      messages: [],
      profile: null
    });
    return session;
  }

  const pool = getDbPool();
  if (!pool) {
    return createFallbackSession();
  }

  try {
    const result = await pool.query(
      `
        insert into chat_sessions (user_id, title, status)
        values ($1, $2, $3)
        returning id, title, status, updated_at, '尚未开始对话。' as preview
      `,
      [userId, "新的河南志愿咨询", "资料未全"]
    );

    return toChatSession(result.rows[0]);
  } catch {
    return createFallbackSession();
  }
}

export async function listChatSessionsForUser(userId: string): Promise<ChatSession[]> {
  if (!hasDatabaseConnection()) {
    return getFallbackStoreForUser(userId).map((record) => record.session);
  }

  const pool = getDbPool();
  if (!pool) {
    return demoSessions;
  }

  try {
    const result = await pool.query(
      `
        select
          s.id,
          s.title,
          s.status,
          s.updated_at,
          coalesce(last_message.content, '尚未开始对话。') as preview
        from chat_sessions s
        left join lateral (
          select content
          from chat_messages m
          where m.session_id = s.id and m.user_id = s.user_id
          order by m.created_at desc
          limit 1
        ) last_message on true
        where s.user_id = $1
        order by s.updated_at desc
        limit 30
      `,
      [userId]
    );

    return result.rows.map(toChatSession);
  } catch {
    return demoSessions;
  }
}

export async function listChatMessagesForSession(
  userId: string,
  sessionId: string
): Promise<ChatMessage[]> {
  if (!hasDatabaseConnection()) {
    return getFallbackSessionForUser(userId, sessionId)?.messages ?? [];
  }

  const pool = getDbPool();
  if (!pool) {
    return [];
  }

  try {
    const result = await pool.query(
      `
        select id, role, content, created_at
        from chat_messages
        where session_id = $1 and user_id = $2
        order by created_at asc
      `,
      [sessionId, userId]
    );

    return result.rows.map(toChatMessage);
  } catch {
    return [];
  }
}

export async function persistChatTurn(input: PersistChatTurnInput): Promise<void> {
  if (!hasDatabaseConnection()) {
    persistFallbackChatTurn(input);
    return;
  }

  const pool = getDbPool();
  if (!pool) {
    return;
  }

  try {
    const sessionId = input.sessionId
      ? await getAuthenticatedSessionId(input.userId, input.sessionId)
      : await getOrCreateDefaultSession(input.userId);
    const createdAt = input.assistantMessage.createdAt;

    await pool.query(
      `
        insert into chat_messages (session_id, user_id, role, content, created_at)
        values ($1, $2, $3, $4, $5)
      `,
      [sessionId, input.userId, "user", input.userMessage, createdAt]
    );

    await pool.query(
      `
        insert into chat_messages (session_id, user_id, role, content, created_at)
        values ($1, $2, $3, $4, $5)
      `,
      [
        sessionId,
        input.userId,
        input.assistantMessage.role,
        input.assistantMessage.content,
        input.assistantMessage.createdAt
      ]
    );

    await pool.query("update chat_sessions set updated_at = $2 where id = $1 and user_id = $3", [
      sessionId,
      input.assistantMessage.createdAt,
      input.userId
    ]);

    if (input.profile) {
      await persistCandidateProfile({
        sessionId,
        userId: input.userId,
        profile: input.profile,
        updatedAt: input.assistantMessage.createdAt
      });
    }
  } catch {
    return;
  }
}

export async function getCandidateProfileForSession(
  userId: string,
  sessionId: string
): Promise<CandidateProfile | null> {
  if (!hasDatabaseConnection()) {
    return getFallbackSessionForUser(userId, sessionId)?.profile ?? null;
  }

  const pool = getDbPool();
  if (!pool) {
    return null;
  }

  try {
    const result = await pool.query(
      `
        select profile
        from candidate_profiles
        where session_id = $1 and user_id = $2
        limit 1
      `,
      [sessionId, userId]
    );

    return normalizeCandidateProfile(result.rows[0]?.profile);
  } catch {
    return null;
  }
}

export async function getLatestCandidateProfileForUser(userId: string): Promise<CandidateProfile | null> {
  if (!hasDatabaseConnection()) {
    return getFallbackStoreForUser(userId).find((record) => record.profile)?.profile ?? null;
  }

  const pool = getDbPool();
  if (!pool) {
    return null;
  }

  try {
    const result = await pool.query(
      `
        select cp.profile
        from candidate_profiles cp
        join chat_sessions s
          on s.id = cp.session_id
          and s.user_id = cp.user_id
        where cp.user_id = $1
        order by s.updated_at desc, cp.updated_at desc
        limit 1
      `,
      [userId]
    );

    return normalizeCandidateProfile(result.rows[0]?.profile);
  } catch {
    return null;
  }
}

export async function persistCandidateProfileForSession({
  userId,
  sessionId,
  profile
}: PersistCandidateProfileForSessionInput): Promise<void> {
  if (!hasDatabaseConnection()) {
    const record = getFallbackSessionForUser(userId, sessionId);
    if (record) {
      record.profile = profile;
      record.session = {
        ...record.session,
        status: "资料未全",
        updatedAt: new Date().toISOString(),
        preview: "已手动修正考生画像。"
      };
    }
    return;
  }

  const session = await getAuthenticatedSessionId(userId, sessionId);
  await persistCandidateProfile({
    sessionId: session,
    userId,
    profile,
    updatedAt: new Date().toISOString()
  });
}

type PersistCandidateProfileInput = {
  sessionId: string;
  userId: string;
  profile: CandidateProfile;
  updatedAt: string;
};

async function persistCandidateProfile({
  sessionId,
  userId,
  profile,
  updatedAt
}: PersistCandidateProfileInput): Promise<void> {
  const pool = getDbPool();
  if (!pool) {
    throw new Error("database pool unavailable");
  }

  await pool.query(
    `
      insert into candidate_profiles (session_id, user_id, profile, updated_at)
      values ($1, $2, $3, $4)
      on conflict (session_id, user_id)
      do update set
        profile = excluded.profile,
        updated_at = excluded.updated_at
      where candidate_profiles.session_id = excluded.session_id
        and candidate_profiles.user_id = excluded.user_id
    `,
    [sessionId, userId, profile, updatedAt]
  );
}

async function getAuthenticatedSessionId(userId: string, sessionId: string): Promise<string> {
  const pool = getDbPool();
  if (!pool) {
    throw new Error("database pool unavailable");
  }

  const existing = await pool.query(
    `
      select id
      from chat_sessions
      where id = $1 and user_id = $2
      limit 1
    `,
    [sessionId, userId]
  );

  const authenticatedSessionId = existing.rows[0]?.id;
  if (!authenticatedSessionId) {
    throw new Error("chat session not found");
  }

  return String(authenticatedSessionId);
}

async function getOrCreateDefaultSession(userId: string): Promise<string> {
  const pool = getDbPool();
  if (!pool) {
    throw new Error("database pool unavailable");
  }

  const existing = await pool.query(
    `
      select id
      from chat_sessions
      where user_id = $1
      order by updated_at desc
      limit 1
    `,
    [userId]
  );

  if (existing.rows[0]?.id) {
    return String(existing.rows[0].id);
  }

  const created = await pool.query(
    `
      insert into chat_sessions (user_id, title, status)
      values ($1, $2, $3)
      returning id
    `,
    [userId, "新的河南志愿咨询", "资料未全"]
  );

  return String(created.rows[0].id);
}

function normalizeStatus(status: unknown): StatusKind {
  if (
    status === "数据未导入" ||
    status === "资料未全" ||
    status === "待确认" ||
    status === "待核验" ||
    status === "可用"
  ) {
    return status;
  }

  return "资料未全";
}

function toChatSession(row: Record<string, unknown>): ChatSession {
  return {
    id: String(row.id),
    title: String(row.title),
    status: normalizeStatus(row.status),
    updatedAt: formatTimestamp(row.updated_at),
    preview: String(row.preview ?? "尚未开始对话。")
  };
}

function toChatMessage(row: Record<string, unknown>): ChatMessage {
  const role = row.role === "assistant" || row.role === "user" ? row.role : "assistant";

  return {
    id: String(row.id),
    role,
    content: String(row.content),
    createdAt: formatTimestamp(row.created_at)
  };
}

function createFallbackSession(): ChatSession {
  return {
    id: crypto.randomUUID(),
    title: "新的河南志愿咨询",
    status: "资料未全",
    updatedAt: new Date().toISOString(),
    preview: "尚未开始对话。"
  };
}

function getFallbackStoreForUser(userId: string): FallbackSessionRecord[] {
  const existingStore = fallbackStores.get(userId);
  if (existingStore) {
    return existingStore;
  }

  const seededStore = demoSessions.map((session) => ({
    session,
    messages: [],
    profile: null
  }));
  fallbackStores.set(userId, seededStore);
  return seededStore;
}

function getFallbackSessionForUser(
  userId: string,
  sessionId: string | undefined
): FallbackSessionRecord | null {
  if (!sessionId) {
    return getFallbackStoreForUser(userId)[0] ?? null;
  }

  return getFallbackStoreForUser(userId).find((record) => record.session.id === sessionId) ?? null;
}

function persistFallbackChatTurn(input: PersistChatTurnInput): void {
  const store = getFallbackStoreForUser(input.userId);
  const record =
    getFallbackSessionForUser(input.userId, input.sessionId) ??
    (() => {
      const session = createFallbackSession();
      const nextRecord = { session, messages: [], profile: null };
      store.unshift(nextRecord);
      return nextRecord;
    })();

  const userMessage: ChatMessage = {
    id: `user-${crypto.randomUUID()}`,
    role: "user",
    content: input.userMessage,
    createdAt: input.assistantMessage.createdAt
  };

  record.messages.push(userMessage, input.assistantMessage);
  record.profile = input.profile ?? record.profile;
  record.session = {
    ...record.session,
    updatedAt: input.assistantMessage.createdAt,
    status: input.profile ? "待核验" : record.session.status,
    preview: input.assistantMessage.content
  };

  const recordIndex = store.indexOf(record);
  if (recordIndex > 0) {
    store.splice(recordIndex, 1);
    store.unshift(record);
  }
}

function formatTimestamp(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
  }

  return new Date().toISOString();
}

function normalizeCandidateProfile(value: unknown): CandidateProfile | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const profile = value as Partial<CandidateProfile>;
  if (profile.province !== "河南") {
    return null;
  }

  return {
    province: "河南",
    score: profile.score,
    rank: profile.rank,
    subjectType: profile.subjectType,
    eligibleNationalSpecialPlan: profile.eligibleNationalSpecialPlan,
    preferredRegions: profile.preferredRegions ?? [],
    excludedRegions: profile.excludedRegions ?? [],
    interestedMajors: profile.interestedMajors ?? [],
    excludedMajors: profile.excludedMajors ?? [],
    familyResources: profile.familyResources,
    budgetConstraints: profile.budgetConstraints,
    primaryGoal: profile.primaryGoal
  };
}
