import type {
  AdmissionImportError,
  SchoolDocument,
  SchoolDocumentImportResult,
  TrustLevel
} from "./types";

const requiredHeaders = [
  "year",
  "school_code",
  "school_name",
  "doc_type",
  "title",
  "source_name",
  "content"
];

const validDocTypes = new Set<SchoolDocument["docType"]>([
  "招生章程",
  "招生计划",
  "专业介绍",
  "就业质量报告"
]);
const validTrustLevels = new Set<TrustLevel>(["T1", "T2", "T3", "T4", "T5"]);

export function parseSchoolDocumentsCsv(csv: string): SchoolDocumentImportResult {
  const rows = parseCsv(csv.trim());
  const errors: AdmissionImportError[] = [];

  if (rows.length === 0) {
    return {
      documents: [],
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
    return { documents: [], errors };
  }

  const documents: SchoolDocument[] = [];

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const rowNumber = rowIndex + 1;
    const values = rows[rowIndex];

    if (values.every((value) => value.trim() === "")) {
      continue;
    }

    const row = Object.fromEntries(headers.map((header, index) => [header, values[index]?.trim() ?? ""]));
    const rowErrors = validateSchoolDocumentRow(row, rowNumber);

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
      continue;
    }

    documents.push(toSchoolDocument(row));
  }

  return { documents, errors };
}

function validateSchoolDocumentRow(row: Record<string, string>, rowNumber: number): AdmissionImportError[] {
  const errors: AdmissionImportError[] = [];

  for (const field of requiredHeaders) {
    if (!row[field]) {
      errors.push({ row: rowNumber, field, message: "字段不能为空" });
    }
  }

  if (row.year && !/^\d+$/.test(row.year)) {
    errors.push({ row: rowNumber, field: "year", message: "字段必须是数字" });
  }

  if (row.doc_type && !validDocTypes.has(row.doc_type as SchoolDocument["docType"])) {
    errors.push({ row: rowNumber, field: "doc_type", message: "文档类型不支持" });
  }

  if (row.trust_level && !validTrustLevels.has(row.trust_level as TrustLevel)) {
    errors.push({ row: rowNumber, field: "trust_level", message: "可信等级不支持" });
  }

  return errors;
}

function toSchoolDocument(row: Record<string, string>): SchoolDocument {
  return {
    year: Number(row.year),
    schoolCode: row.school_code,
    schoolName: row.school_name,
    docType: row.doc_type as SchoolDocument["docType"],
    title: row.title,
    sourceName: row.source_name,
    sourceUrl: optionalString(row.source_url),
    publishedAt: optionalString(row.published_at),
    trustLevel: (row.trust_level || "T2") as TrustLevel,
    content: row.content,
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

function optionalString(value: string | undefined): string | undefined {
  return value?.trim() ? value.trim() : undefined;
}
