import { describe, expect, it } from "vitest";
import { extractProfileFromMessage, getMissingProfileFields } from "./extract";

describe("extractProfileFromMessage", () => {
  it("normalizes colloquial science stream to the official physics subject type", () => {
    const profile = extractProfileFromMessage("河南理科 580 分，位次 3 万，想省内稳一点");

    expect(profile).toMatchObject({
      province: "河南",
      score: 580,
      rank: 30000,
      subjectType: "物理类",
      primaryGoal: "稳定"
    });
    expect(profile.preferredRegions).toContain("河南");
  });

  it("reports rank as missing before full recommendation", () => {
    const profile = extractProfileFromMessage("河南历史类 610 分，想考公");

    expect(getMissingProfileFields(profile)).toContain("rank");
  });
});
