import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getDbPool, hasDatabaseConnection } from "@/lib/db/client";
import { parseSchoolDocumentsCsv } from "@/lib/admissions/school-documents";
import type { SchoolDocument, TrustLevel } from "@/lib/admissions/types";

const sampleSchoolDocumentsPath = "fixtures/admissions/sample-school-documents.csv";
const riskKeywords = ["体检", "色盲", "色弱", "单科", "外语", "校区", "学费", "转专业"];

export type SchoolDocumentCandidate = {
  id: string;
  schoolName: string;
  majorName: string;
  riskTags: string[];
};

export type SchoolDocumentMatch = {
  candidateId: string;
  schoolName: string;
  title: string;
  docType: SchoolDocument["docType"];
  trustLevel: TrustLevel;
  sourceName: string;
  snippet: string;
  riskTags: string[];
};

export type SchoolDocumentSearchResult = {
  matches: SchoolDocumentMatch[];
  dataMode: "database" | "sample" | "empty";
};

export async function searchSchoolDocumentsForCandidates(
  candidates: SchoolDocumentCandidate[]
): Promise<SchoolDocumentSearchResult> {
  if (candidates.length === 0) {
    return { matches: [], dataMode: "empty" };
  }

  if (hasDatabaseConnection()) {
    const documents = await listDatabaseSchoolDocuments(candidates.map((candidate) => candidate.schoolName));
    return {
      matches: matchDocuments(candidates, documents),
      dataMode: documents.length > 0 ? "database" : "empty"
    };
  }

  const csv = readFileSync(join(process.cwd(), sampleSchoolDocumentsPath), "utf8");
  const result = parseSchoolDocumentsCsv(csv);
  if (result.errors.length > 0) {
    return { matches: [], dataMode: "empty" };
  }

  return {
    matches: matchDocuments(candidates, result.documents),
    dataMode: "sample"
  };
}

async function listDatabaseSchoolDocuments(schoolNames: string[]): Promise<SchoolDocument[]> {
  const pool = getDbPool();
  if (!pool) {
    return [];
  }

  try {
    const result = await pool.query(
      `
        select
          id,
          year,
          school_code,
          school_name,
          doc_type,
          title,
          source_name,
          source_url,
          published_at,
          trust_level,
          content,
          imported_at
        from school_documents
        where school_name = any($1)
        order by year desc, doc_type asc
      `,
      [schoolNames]
    );

    return result.rows.map((row) => ({
      id: String(row.id),
      year: Number(row.year),
      schoolCode: String(row.school_code ?? ""),
      schoolName: String(row.school_name),
      docType: row.doc_type,
      title: String(row.title),
      sourceName: String(row.source_name),
      sourceUrl: optionalString(row.source_url),
      publishedAt: optionalString(row.published_at),
      trustLevel: row.trust_level as TrustLevel,
      content: String(row.content),
      importedAt: optionalString(row.imported_at)
    }));
  } catch {
    return [];
  }
}

function matchDocuments(
  candidates: SchoolDocumentCandidate[],
  documents: SchoolDocument[]
): SchoolDocumentMatch[] {
  return candidates.flatMap((candidate) =>
    documents
      .filter((document) => document.schoolName === candidate.schoolName)
      .map((document) => toMatch(candidate, document))
  );
}

function toMatch(
  candidate: SchoolDocumentCandidate,
  document: SchoolDocument
): SchoolDocumentMatch {
  const matchedRiskKeywords = riskKeywords.filter((keyword) => document.content.includes(keyword));
  const riskTags =
    matchedRiskKeywords.length > 0 ? ["章程含体检/单科限制"] : ["章程资料待人工复核"];

  return {
    candidateId: candidate.id,
    schoolName: candidate.schoolName,
    title: document.title,
    docType: document.docType,
    trustLevel: document.trustLevel,
    sourceName: document.sourceName,
    snippet: buildSnippet(document.content, matchedRiskKeywords[0] ?? candidate.majorName),
    riskTags
  };
}

function buildSnippet(content: string, keyword: string): string {
  const index = keyword ? content.indexOf(keyword) : -1;
  if (index < 0) {
    return content.slice(0, 80);
  }

  const start = Math.max(0, index - 24);
  return content.slice(start, start + 96);
}

function optionalString(value: unknown): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  const stringValue = value instanceof Date ? value.toISOString().slice(0, 10) : String(value);
  return stringValue.trim() ? stringValue : undefined;
}
