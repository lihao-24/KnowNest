import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseAdmissionRecordsCsv } from "./importer";
import { importAdmissionRecords } from "./db-import";

describe("importAdmissionRecords", () => {
  it("inserts sample admission records and preserves missing plan count as null", async () => {
    const csv = readFileSync(
      join(process.cwd(), "fixtures/admissions/sample-admission-records.csv"),
      "utf8"
    );
    const parsed = parseAdmissionRecordsCsv(csv);
    const calls: unknown[][] = [];

    await importAdmissionRecords(parsed.records, {
      query: async (_sql, values) => {
        calls.push(values);
        return { rows: [] };
      }
    });

    expect(calls).toHaveLength(12);
    expect(calls.some((values) => values[15] === null)).toBe(true);
  });
});
