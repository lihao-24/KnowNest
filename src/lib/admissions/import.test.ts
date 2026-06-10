import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseAdmissionRecordsCsv, parseEnrollmentPlansCsv } from "./importer";

describe("parseAdmissionRecordsCsv", () => {
  it("imports the committed sample admissions fixture", () => {
    const csv = readFileSync(
      join(process.cwd(), "fixtures/admissions/sample-admission-records.csv"),
      "utf8"
    );

    const result = parseAdmissionRecordsCsv(csv);

    expect(result.errors).toEqual([]);
    expect(result.records).toHaveLength(12);
    expect(result.records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          planType: "普通本科批",
          subjectType: "物理类",
          minRank: 28500
        }),
        expect.objectContaining({
          planType: "国家专项计划",
          subjectType: "历史类"
        })
      ])
    );
    expect(result.records.some((record) => record.planCount === undefined)).toBe(true);
    expect(
      result.records.every((record) => record.sourceName.includes("样例"))
    ).toBe(true);
  });

  it("imports valid admission rows with official subject type", () => {
    const csv = [
      "year,province,batch,plan_type,subject_type,school_code,school_name,major_group_code,major_group_name,major_code,major_name,min_score,min_rank,avg_score,avg_rank,plan_count,source_name,source_url,source_published_at,notes",
      "2025,河南,本科批,普通本科批,物理类,10459,郑州大学,,,080901,计算机类,590,28000,600,24000,120,河南省教育考试院,https://www.haeea.cn/,2025-06-25,官方投档表"
    ].join("\n");

    const result = parseAdmissionRecordsCsv(csv);

    expect(result.errors).toEqual([]);
    expect(result.records).toHaveLength(1);
    expect(result.records[0]).toMatchObject({
      year: 2025,
      batch: "本科批",
      planType: "普通本科批",
      subjectType: "物理类",
      minRank: 28000
    });
  });

  it("returns row and field information for invalid numeric data", () => {
    const csv = [
      "year,province,batch,plan_type,subject_type,school_code,school_name,major_group_code,major_group_name,major_code,major_name,min_score,min_rank,avg_score,avg_rank,plan_count,source_name,source_url,source_published_at,notes",
      "2025,河南,本科批,普通本科批,物理类,10459,郑州大学,,,080901,计算机类,abc,28000,,,120,河南省教育考试院,https://www.haeea.cn/,2025-06-25,官方投档表"
    ].join("\n");

    const result = parseAdmissionRecordsCsv(csv);

    expect(result.errors).toContainEqual(
      expect.objectContaining({ row: 2, field: "min_score" })
    );
    expect(result.records).toHaveLength(0);
  });
});

describe("parseEnrollmentPlansCsv", () => {
  it("imports the committed sample enrollment plans fixture", () => {
    const csv = readFileSync(
      join(process.cwd(), "fixtures/admissions/sample-enrollment-plans.csv"),
      "utf8"
    );

    const result = parseEnrollmentPlansCsv(csv);

    expect(result.errors).toEqual([]);
    expect(result.plans).toHaveLength(4);
    expect(result.plans).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          schoolCode: "S002",
          majorCode: "080601",
          planCount: 60,
          trustLevel: "T5"
        })
      ])
    );
    expect(result.plans.every((plan) => plan.sourceName.includes("样例"))).toBe(true);
  });

  it("returns row and field information for invalid plan count", () => {
    const csv = [
      "year,province,batch,plan_type,subject_type,school_code,school_name,major_group_code,major_group_name,major_code,major_name,plan_count,tuition,duration,campus,requirements,source_name,source_url,source_published_at,trust_level,notes",
      "2026,河南,本科批,普通本科批,物理类,S002,黄河样例学院,,,080601,电气工程及其自动化,abc,5000,4年,主校区,,河南招生样例数据（非真实）,https://example.invalid/henan-plan-sample,2026-06-25,T5,虚构样例"
    ].join("\n");

    const result = parseEnrollmentPlansCsv(csv);

    expect(result.errors).toContainEqual(
      expect.objectContaining({ row: 2, field: "plan_count" })
    );
    expect(result.plans).toHaveLength(0);
  });
});
