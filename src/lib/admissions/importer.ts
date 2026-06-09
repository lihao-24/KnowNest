import type {
  AdmissionImportError,
  AdmissionImportResult,
  AdmissionRecord,
  Batch,
  PlanType,
  TrustLevel
} from "./types";
import type { SubjectType } from "@/lib/profile/types";

const requiredHeaders = [
  "year",
  "province",
  "batch",
  "plan_type",
  "subject_type",
  "school_code",
  "school_name",
  "min_score",
  "min_rank",
  "plan_count",
  "source_name"
];

const numericFields = new Set([
  "year",
  "min_score",
  "min_rank",
  "avg_score",
  "avg_rank",
  "plan_count"
]);

const validSubjectTypes = new Set<SubjectType>(["物理类", "历史类"]);
const validPlanTypes = new Set<PlanType>(["普通本科批", "国家专项计划"]);
const validBatches = new Set<Batch>(["本科批"]);
const validTrustLevels = new Set<TrustLevel>(["T1", "T2", "T3", "T4", "T5"]);

export function parseAdmissionRecordsCsv(csv: string): AdmissionImportResult {
  const rows = parseCsv(csv.trim());
  const errors: AdmissionImportError[] = [];

  if (rows.length === 0) {
    return {
      records: [],
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
    return { records: [], errors };
  }

  const records: AdmissionRecord[] = [];

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const rowNumber = rowIndex + 1;
    const values = rows[rowIndex];

    if (values.every((value) => value.trim() === "")) {
      continue;
    }

    const row = Object.fromEntries(headers.map((header, index) => [header, values[index]?.trim() ?? ""]));
    const rowErrors = validateAdmissionRow(row, rowNumber);

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
      continue;
    }

    records.push(toAdmissionRecord(row));
  }

  return { records, errors };
}

function validateAdmissionRow(row: Record<string, string>, rowNumber: number): AdmissionImportError[] {
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

  if (row.batch && !validBatches.has(row.batch as Batch)) {
    errors.push({ row: rowNumber, field: "batch", message: "批次必须为本科批" });
  }

  if (row.plan_type && !validPlanTypes.has(row.plan_type as PlanType)) {
    errors.push({ row: rowNumber, field: "plan_type", message: "计划类型不支持" });
  }

  if (row.subject_type && !validSubjectTypes.has(row.subject_type as SubjectType)) {
    errors.push({ row: rowNumber, field: "subject_type", message: "科类必须为物理类或历史类" });
  }

  if (row.trust_level && !validTrustLevels.has(row.trust_level as TrustLevel)) {
    errors.push({ row: rowNumber, field: "trust_level", message: "可信等级不支持" });
  }

  return errors;
}

function toAdmissionRecord(row: Record<string, string>): AdmissionRecord {
  return {
    year: Number(row.year),
    province: row.province,
    batch: row.batch as Batch,
    planType: row.plan_type as PlanType,
    subjectType: row.subject_type as SubjectType,
    schoolCode: row.school_code,
    schoolName: row.school_name,
    majorGroupCode: optionalString(row.major_group_code),
    majorGroupName: optionalString(row.major_group_name),
    majorCode: optionalString(row.major_code),
    majorName: optionalString(row.major_name),
    minScore: optionalNumber(row.min_score),
    minRank: optionalNumber(row.min_rank),
    avgScore: optionalNumber(row.avg_score),
    avgRank: optionalNumber(row.avg_rank),
    planCount: optionalNumber(row.plan_count),
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

    if (char === "\"") {
      if (inQuotes && nextChar === "\"") {
        field += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
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

  return rows;
}

function optionalString(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function optionalNumber(value: string | undefined): number | undefined {
  return value ? Number(value) : undefined;
}

function isPlainNumber(value: string): boolean {
  return /^-?\d+(?:\.\d+)?$/.test(value.trim());
}
