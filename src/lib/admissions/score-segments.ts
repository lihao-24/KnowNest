import type {
  AdmissionImportError,
  ScoreSegment,
  ScoreSegmentImportResult,
  TrustLevel
} from "./types";
import type { SubjectType } from "@/lib/profile/types";

const requiredHeaders = [
  "year",
  "province",
  "subject_type",
  "score",
  "same_score_count",
  "cumulative_count",
  "source_name"
];

const numericFields = new Set(["year", "score", "same_score_count", "cumulative_count"]);
const validSubjectTypes = new Set<SubjectType>(["物理类", "历史类"]);
const validTrustLevels = new Set<TrustLevel>(["T1", "T2", "T3", "T4", "T5"]);

export function parseScoreSegmentsCsv(csv: string): ScoreSegmentImportResult {
  const rows = parseCsv(csv.trim());
  const errors: AdmissionImportError[] = [];

  if (rows.length === 0) {
    return {
      segments: [],
      errors: [{ row: 1, field: "header", message: "CSV 内容为空" }]
    };
  }

  const headers = rows[0].map((header) => header.trim());
  const headerSet = new Set(headers);

  for (const header of requiredHeaders) {
    if (!headerSet.has(header)) {
      errors.push({ row: 1, field: header, message: `缺少必填字段 ${header}` });
    }
  }

  if (errors.length > 0) {
    return { segments: [], errors };
  }

  const segments: ScoreSegment[] = [];

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const rowNumber = rowIndex + 1;
    const values = rows[rowIndex];

    if (values.every((value) => value.trim() === "")) {
      continue;
    }

    const row = Object.fromEntries(headers.map((header, index) => [header, values[index]?.trim() ?? ""]));
    const rowErrors = validateScoreSegmentRow(row, rowNumber);

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
      continue;
    }

    segments.push(toScoreSegment(row));
  }

  return { segments, errors };
}

function validateScoreSegmentRow(row: Record<string, string>, rowNumber: number): AdmissionImportError[] {
  const errors: AdmissionImportError[] = [];

  for (const field of requiredHeaders) {
    if (!row[field]) {
      errors.push({ row: rowNumber, field, message: "字段不能为空" });
    }
  }

  for (const field of numericFields) {
    if (row[field] && !isPlainNumber(row[field])) {
      errors.push({ row: rowNumber, field, message: "字段必须是数字" });
    }
  }

  if (row.subject_type && !validSubjectTypes.has(row.subject_type as SubjectType)) {
    errors.push({ row: rowNumber, field: "subject_type", message: "科类必须为物理类或历史类" });
  }

  if (row.trust_level && !validTrustLevels.has(row.trust_level as TrustLevel)) {
    errors.push({ row: rowNumber, field: "trust_level", message: "可信等级不支持" });
  }

  return errors;
}

function toScoreSegment(row: Record<string, string>): ScoreSegment {
  return {
    year: Number(row.year),
    province: row.province,
    subjectType: row.subject_type as SubjectType,
    score: Number(row.score),
    sameScoreCount: Number(row.same_score_count),
    cumulativeCount: Number(row.cumulative_count),
    sourceName: row.source_name,
    sourceUrl: optionalString(row.source_url),
    sourcePublishedAt: optionalString(row.source_published_at),
    trustLevel: (row.trust_level || "T1") as TrustLevel,
    notes: optionalString(row.notes)
  };
}

function parseCsv(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const nextChar = csv[index + 1];

    if (char === "\"" && inQuotes && nextChar === "\"") {
      field += "\"";
      index += 1;
      continue;
    }

    if (char === "\"") {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  row.push(field);
  rows.push(row);

  return rows.filter((values) => values.some((value) => value.trim() !== ""));
}

function isPlainNumber(value: string): boolean {
  return /^-?\d+(\.\d+)?$/.test(value);
}

function optionalString(value: string | undefined): string | undefined {
  return value?.trim() ? value.trim() : undefined;
}
