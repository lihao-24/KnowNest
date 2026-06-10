import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDbPool, hasDatabaseConnection } from "./client";
import {
  deleteSavedChoiceForUser,
  listSavedChoicesForUser,
  saveChoiceForUser
} from "./saved-choice-repository";

vi.mock("./client", () => ({
  getDbPool: vi.fn(),
  hasDatabaseConnection: vi.fn()
}));

const mockedGetDbPool = vi.mocked(getDbPool);
const mockedHasDatabaseConnection = vi.mocked(hasDatabaseConnection);

const choiceInput = {
  userId: "user-1",
  sessionId: "00000000-0000-4000-8000-000000000001",
  candidateId: "2026:普通本科批:物理类:S001:080901",
  schoolName: "中原样例大学",
  majorName: "计算机科学与技术",
  batch: "本科批",
  planType: "普通本科批",
  bucket: "稳",
  rationale: "最低位次接近，仍需核验章程。",
  riskTags: ["缺少当年招生计划"],
  sources: [{ title: "样例来源", trustLevel: "T5" }]
} as const;

describe("saved choice repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saves a choice for the authenticated user and session", async () => {
    mockedHasDatabaseConnection.mockReturnValue(true);
    const query = vi.fn().mockResolvedValue({
      rows: [
        {
          id: "choice-1",
          user_id: "user-1",
          session_id: choiceInput.sessionId,
          candidate_id: choiceInput.candidateId,
          school_name: choiceInput.schoolName,
          major_name: choiceInput.majorName,
          batch: "本科批",
          plan_type: "普通本科批",
          bucket: "稳",
          rationale: choiceInput.rationale,
          risk_tags: choiceInput.riskTags,
          sources: choiceInput.sources,
          note: null,
          created_at: new Date("2026-06-11T08:00:00.000Z")
        }
      ]
    });
    mockedGetDbPool.mockReturnValue({ query } as never);

    const saved = await saveChoiceForUser(choiceInput);

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("insert into saved_choices"),
      [
        "user-1",
        choiceInput.sessionId,
        choiceInput.candidateId,
        choiceInput.schoolName,
        choiceInput.majorName,
        "本科批",
        "普通本科批",
        "稳",
        choiceInput.rationale,
        choiceInput.riskTags,
        choiceInput.sources,
        null
      ]
    );
    expect(saved).toMatchObject({
      id: "choice-1",
      userId: "user-1",
      candidateId: choiceInput.candidateId,
      schoolName: choiceInput.schoolName,
      isSaved: true
    });
  });

  it("lists saved choices for only the authenticated user", async () => {
    mockedHasDatabaseConnection.mockReturnValue(true);
    const query = vi.fn().mockResolvedValue({
      rows: [
        {
          id: "choice-1",
          user_id: "user-1",
          session_id: null,
          candidate_id: choiceInput.candidateId,
          school_name: choiceInput.schoolName,
          major_name: choiceInput.majorName,
          batch: "本科批",
          plan_type: "普通本科批",
          bucket: "稳",
          rationale: choiceInput.rationale,
          risk_tags: choiceInput.riskTags,
          sources: choiceInput.sources,
          note: null,
          created_at: new Date("2026-06-11T08:00:00.000Z")
        }
      ]
    });
    mockedGetDbPool.mockReturnValue({ query } as never);

    const choices = await listSavedChoicesForUser("user-1");

    expect(query).toHaveBeenCalledWith(expect.stringContaining("where user_id = $1"), ["user-1"]);
    expect(choices).toHaveLength(1);
    expect(choices[0]?.candidateId).toBe(choiceInput.candidateId);
  });

  it("deletes only the requested user's saved choice", async () => {
    mockedHasDatabaseConnection.mockReturnValue(true);
    const query = vi.fn().mockResolvedValue({ rowCount: 1, rows: [] });
    mockedGetDbPool.mockReturnValue({ query } as never);

    const result = await deleteSavedChoiceForUser("user-1", choiceInput.candidateId);

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("where user_id = $1 and candidate_id = $2"),
      ["user-1", choiceInput.candidateId]
    );
    expect(result).toEqual({ deleted: true });
  });

  it("keeps an in-memory fallback basket when the database is disabled", async () => {
    mockedHasDatabaseConnection.mockReturnValue(false);
    mockedGetDbPool.mockReturnValue(null);

    await saveChoiceForUser(choiceInput);
    await expect(listSavedChoicesForUser("user-1")).resolves.toEqual([
      expect.objectContaining({
        userId: "user-1",
        candidateId: choiceInput.candidateId,
        schoolName: choiceInput.schoolName
      })
    ]);

    await expect(deleteSavedChoiceForUser("user-1", choiceInput.candidateId)).resolves.toEqual({
      deleted: true
    });
    await expect(listSavedChoicesForUser("user-1")).resolves.toEqual([]);
  });
});
