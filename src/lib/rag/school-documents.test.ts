import { describe, expect, it, vi } from "vitest";
import { parseSchoolDocumentsCsv } from "@/lib/admissions/school-documents";
import { searchSchoolDocumentsForCandidates } from "./school-document-search";
import { getDbPool, hasDatabaseConnection } from "@/lib/db/client";

vi.mock("@/lib/db/client", () => ({
  getDbPool: vi.fn(),
  hasDatabaseConnection: vi.fn()
}));

const mockedGetDbPool = vi.mocked(getDbPool);
const mockedHasDatabaseConnection = vi.mocked(hasDatabaseConnection);

describe("school document keyword RAG", () => {
  it("parses school document CSV rows", () => {
    const result = parseSchoolDocumentsCsv(
      [
        "year,school_code,school_name,doc_type,title,source_name,trust_level,content",
        "2026,S001,中原样例大学,招生章程,中原样例大学招生章程,虚构样例,T5,体检色盲限制；单科英语不低于 100 分。"
      ].join("\n")
    );

    expect(result.errors).toEqual([]);
    expect(result.documents).toEqual([
      expect.objectContaining({
        year: 2026,
        schoolName: "中原样例大学",
        docType: "招生章程",
        trustLevel: "T5",
        content: expect.stringContaining("色盲")
      })
    ]);
  });

  it("searches sample documents for candidate school names and risk keywords", async () => {
    mockedHasDatabaseConnection.mockReturnValue(false);
    mockedGetDbPool.mockReturnValue(null);

    const result = await searchSchoolDocumentsForCandidates([
      {
        id: "candidate-1",
        schoolName: "中原样例大学",
        majorName: "计算机科学与技术",
        riskTags: []
      }
    ]);

    expect(result.dataMode).toBe("sample");
    expect(result.matches).toEqual([
      expect.objectContaining({
        schoolName: "中原样例大学",
        riskTags: expect.arrayContaining(["章程含体检/单科限制"])
      })
    ]);
  });
});
