import { demoSessions } from "@/lib/chat/demo-data";
import type { ChatMessage, ChatSession, StatusKind } from "@/lib/chat/types";
import { getDbPool, hasDatabaseConnection } from "./client";

export type PersistChatTurnInput = {
  userId: string;
  userMessage: string;
  assistantMessage: ChatMessage;
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
  } catch {
    return;
  }
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
  if (status === "资料未全" || status === "待确认" || status === "待核验" || status === "可用") {
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
