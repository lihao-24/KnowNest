import { describe, expect, it } from "vitest";
import { parseAdmissionRecordsCsv } from "./importer";

describe("parseAdmissionRecordsCsv", () => {
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
