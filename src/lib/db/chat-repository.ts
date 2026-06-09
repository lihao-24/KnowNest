import { demoSessions } from "@/lib/chat/demo-data";
import type { ChatMessage, ChatSession, StatusKind } from "@/lib/chat/types";
import type { CandidateProfile } from "@/lib/profile/types";
import { getDbPool, hasDatabaseConnection } from "./client";

export type PersistChatTurnInput = {
  userId: string;
  userMessage: string;
  assistantMessage: ChatMessage;
  profile?: CandidateProfile;
};

export async function listChatSessionsForUser(userId: string): Promise<ChatSession[]> {
  if (!hasDatabaseConnection()) {
    return demoSessions;
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

    return result.rows.map((row) => ({
      id: String(row.id),
      title: String(row.title),
      status: normalizeStatus(row.status),
      updatedAt: formatTimestamp(row.updated_at),
      preview: String(row.preview)
    }));
  } catch {
    return demoSessions;
  }
}

export async function persistChatTurn(input: PersistChatTurnInput): Promise<void> {
  if (!hasDatabaseConnection()) {
    return;
  }

  const pool = getDbPool();
  if (!pool) {
    return;
  }

  try {
    const sessionId = await getOrCreateDefaultSession(input.userId);
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
    return null;
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
