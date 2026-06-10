import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseAdmissionRecordsCsv, parseEnrollmentPlansCsv } from "./importer";
import { importAdmissionRecords, importEnrollmentPlans } from "./db-import";

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

describe("importEnrollmentPlans", () => {
  it("inserts sample enrollment plans with plan details", async () => {
    const csv = readFileSync(
      join(process.cwd(), "fixtures/admissions/sample-enrollment-plans.csv"),
      "utf8"
    );
    const parsed = parseEnrollmentPlansCsv(csv);
    const calls: unknown[][] = [];

    await importEnrollmentPlans(parsed.plans, {
      query: async (_sql, values) => {
        calls.push(values);
        return { rows: [] };
      }
    });

    expect(calls).toHaveLength(4);
    expect(calls[0][11]).toBe(90);
    expect(calls[0][12]).toBe("5000");
    expect(calls[0][14]).toBe("主校区");
  });
});
