import { beforeEach, describe, expect, it, vi } from "vitest";
import { demoSessions } from "@/lib/chat/demo-data";
import type { ChatMessage } from "@/lib/chat/types";
import { getDbPool, hasDatabaseConnection } from "./client";
import {
  createChatSessionForUser,
  getCandidateProfileForSession,
  getLatestCandidateProfileForUser,
  listChatMessagesForSession,
  listChatSessionsForUser,
  persistChatTurn
} from "./chat-repository";

vi.mock("./client", () => ({
  getDbPool: vi.fn(),
  hasDatabaseConnection: vi.fn()
}));

const mockedGetDbPool = vi.mocked(getDbPool);
const mockedHasDatabaseConnection = vi.mocked(hasDatabaseConnection);

describe("chat repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists database sessions for only the requested user when database is configured", async () => {
    mockedHasDatabaseConnection.mockReturnValue(true);
    const query = vi.fn().mockResolvedValue({
      rows: [
        {
          id: "session-1",
          title: "河南物理类咨询",
          status: "资料未全",
          updated_at: new Date("2026-06-09T08:30:00.000Z"),
          preview: "缺少全省位次。"
        }
      ]
    });
    mockedGetDbPool.mockReturnValue({ query } as never);

    const sessions = await listChatSessionsForUser("user-1");

    expect(query).toHaveBeenCalledWith(expect.stringContaining("where s.user_id = $1"), ["user-1"]);
    expect(sessions).toEqual([
      {
        id: "session-1",
        title: "河南物理类咨询",
        status: "资料未全",
        updatedAt: "2026-06-09T08:30:00.000Z",
        preview: "缺少全省位次。"
      }
    ]);
  });

  it("falls back to demo sessions when a configured database query fails", async () => {
    mockedHasDatabaseConnection.mockReturnValue(true);
    mockedGetDbPool.mockReturnValue({
      query: vi.fn().mockRejectedValue(new Error("database unavailable"))
    } as never);

    await expect(listChatSessionsForUser("user-1")).resolves.toEqual(demoSessions);
  });

  it("creates a new chat session for the authenticated user", async () => {
    mockedHasDatabaseConnection.mockReturnValue(true);
    const query = vi.fn().mockResolvedValue({
      rows: [
        {
          id: "session-new",
          title: "新的河南志愿咨询",
          status: "资料未全",
          updated_at: new Date("2026-06-09T08:30:00.000Z"),
          preview: "尚未开始对话。"
        }
      ]
    });
    mockedGetDbPool.mockReturnValue({ query } as never);

    const session = await createChatSessionForUser("user-1");

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("insert into chat_sessions (user_id, title, status)"),
      ["user-1", "新的河南志愿咨询", "资料未全"]
    );
    expect(session).toEqual({
      id: "session-new",
      title: "新的河南志愿咨询",
      status: "资料未全",
      updatedAt: "2026-06-09T08:30:00.000Z",
      preview: "尚未开始对话。"
    });
  });

  it("lists chat messages for a requested session and authenticated user in chronological order", async () => {
    mockedHasDatabaseConnection.mockReturnValue(true);
    const query = vi.fn().mockResolvedValue({
      rows: [
        {
          id: "message-1",
          role: "user",
          content: "河南物理类 580 分",
          created_at: new Date("2026-06-09T08:30:00.000Z")
        },
        {
          id: "message-2",
          role: "assistant",
          content: "请补充全省位次。",
          created_at: new Date("2026-06-09T08:31:00.000Z")
        }
      ]
    });
    mockedGetDbPool.mockReturnValue({ query } as never);

    const messages = await listChatMessagesForSession("user-1", "session-1");

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("where session_id = $1 and user_id = $2"),
      ["session-1", "user-1"]
    );
    expect(query).toHaveBeenCalledWith(expect.stringContaining("order by created_at asc"), [
      "session-1",
      "user-1"
    ]);
    expect(messages).toEqual([
      {
        id: "message-1",
        role: "user",
        content: "河南物理类 580 分",
        createdAt: "2026-06-09T08:30:00.000Z"
      },
      {
        id: "message-2",
        role: "assistant",
        content: "请补充全省位次。",
        createdAt: "2026-06-09T08:31:00.000Z"
      }
    ]);
  });

  it("persists user and assistant messages with the authenticated user id", async () => {
    mockedHasDatabaseConnection.mockReturnValue(true);
    const query = vi
      .fn()
      .mockResolvedValueOnce({ rows: [{ id: "session-1" }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });
    mockedGetDbPool.mockReturnValue({ query } as never);
    const assistantMessage: ChatMessage = {
      id: "assistant-1",
      role: "assistant",
      content: "先补全省位次。",
      createdAt: "2026-06-09T08:31:00.000Z"
    };

    await persistChatTurn({
      userId: "user-1",
      userMessage: "河南物理类 580 分",
      assistantMessage
    });

    expect(query).toHaveBeenNthCalledWith(1, expect.stringContaining("where user_id = $1"), ["user-1"]);
    expect(query).toHaveBeenNthCalledWith(2, expect.stringContaining("insert into chat_messages"), [
      "session-1",
      "user-1",
      "user",
      "河南物理类 580 分",
      "2026-06-09T08:31:00.000Z"
    ]);
    expect(query).toHaveBeenNthCalledWith(3, expect.stringContaining("insert into chat_messages"), [
      "session-1",
      "user-1",
      "assistant",
      "先补全省位次。",
      "2026-06-09T08:31:00.000Z"
    ]);
  });

  it("persists a chat turn into the requested authenticated user session", async () => {
    mockedHasDatabaseConnection.mockReturnValue(true);
    const query = vi
      .fn()
      .mockResolvedValueOnce({ rows: [{ id: "session-requested" }] })
      .mockResolvedValue({ rows: [] });
    mockedGetDbPool.mockReturnValue({ query } as never);
    const assistantMessage: ChatMessage = {
      id: "assistant-1",
      role: "assistant",
      content: "继续按这个会话画像判断。",
      createdAt: "2026-06-09T08:31:00.000Z"
    };

    await persistChatTurn({
      userId: "user-1",
      sessionId: "session-requested",
      userMessage: "位次 3 万，想稳一点",
      assistantMessage
    });

    expect(query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("where id = $1 and user_id = $2"),
      ["session-requested", "user-1"]
    );
    expect(query).toHaveBeenNthCalledWith(2, expect.stringContaining("insert into chat_messages"), [
      "session-requested",
      "user-1",
      "user",
      "位次 3 万，想稳一点",
      "2026-06-09T08:31:00.000Z"
    ]);
    expect(query).not.toHaveBeenCalledWith(
      expect.stringContaining("where user_id = $1"),
      ["user-1"]
    );
  });

  it("persists the extracted candidate profile for the authenticated user session", async () => {
    mockedHasDatabaseConnection.mockReturnValue(true);
    const query = vi
      .fn()
      .mockResolvedValueOnce({ rows: [{ id: "session-1" }] })
      .mockResolvedValue({ rows: [] });
    mockedGetDbPool.mockReturnValue({ query } as never);
    const assistantMessage: ChatMessage = {
      id: "assistant-1",
      role: "assistant",
      content: "已记录画像。",
      createdAt: "2026-06-09T08:31:00.000Z"
    };

    await persistChatTurn({
      userId: "user-1",
      userMessage: "河南理科 580 分，位次 3 万",
      assistantMessage,
      profile: {
        province: "河南",
        score: 580,
        rank: 30000,
        subjectType: "物理类",
        preferredRegions: [],
        excludedRegions: [],
        interestedMajors: [],
        excludedMajors: []
      }
    });

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("insert into candidate_profiles"),
      [
        "session-1",
        "user-1",
        expect.objectContaining({
          province: "河南",
          score: 580,
          rank: 30000,
          subjectType: "物理类"
        }),
        "2026-06-09T08:31:00.000Z"
      ]
    );
    expect(
      query.mock.calls.some(
        ([sql]) =>
          typeof sql === "string" &&
          sql.includes("where candidate_profiles.session_id = excluded.session_id") &&
          sql.includes("candidate_profiles.user_id = excluded.user_id")
      )
    ).toBe(true);
  });

  it("loads candidate profiles by session id and authenticated user id", async () => {
    mockedHasDatabaseConnection.mockReturnValue(true);
    const query = vi.fn().mockResolvedValue({
      rows: [
        {
          profile: {
            province: "河南",
            score: 580,
            rank: 30000,
            subjectType: "物理类",
            preferredRegions: [],
            excludedRegions: [],
            interestedMajors: [],
            excludedMajors: []
          }
        }
      ]
    });
    mockedGetDbPool.mockReturnValue({ query } as never);

    const profile = await getCandidateProfileForSession("user-1", "session-1");

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("where session_id = $1 and user_id = $2"),
      ["session-1", "user-1"]
    );
    expect(profile).toMatchObject({
      province: "河南",
      score: 580,
      rank: 30000,
      subjectType: "物理类"
    });
  });

  it("loads the latest candidate profile for the authenticated user", async () => {
    mockedHasDatabaseConnection.mockReturnValue(true);
    const query = vi.fn().mockResolvedValue({
      rows: [
        {
          profile: {
            province: "河南",
            score: 580,
            rank: 20000,
            subjectType: "物理类",
            preferredRegions: ["河南"],
            excludedRegions: [],
            interestedMajors: ["计算机"],
            excludedMajors: [],
            primaryGoal: "考研"
          }
        }
      ]
    });
    mockedGetDbPool.mockReturnValue({ query } as never);

    const profile = await getLatestCandidateProfileForUser("user-1");

    expect(query).toHaveBeenCalledWith(expect.stringContaining("where cp.user_id = $1"), [
      "user-1"
    ]);
    expect(query).toHaveBeenCalledWith(expect.stringContaining("order by s.updated_at desc"), [
      "user-1"
    ]);
    expect(profile).toMatchObject({
      province: "河南",
      score: 580,
      rank: 20000,
      subjectType: "物理类",
      interestedMajors: ["计算机"],
      primaryGoal: "考研"
    });
  });
});
