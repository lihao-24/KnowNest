import { beforeEach, describe, expect, it, vi } from "vitest";
import { demoSessions } from "@/lib/chat/demo-data";
import type { ChatMessage } from "@/lib/chat/types";
import { getDbPool, hasDatabaseConnection } from "./client";
import { listChatSessionsForUser, persistChatTurn } from "./chat-repository";

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
});
