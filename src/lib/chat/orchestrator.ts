import { generateAssistantText } from "@/lib/ai/provider";
import {
  listAdmissionRecordsForProfile,
  listEnrollmentPlansForProfile
} from "@/lib/admissions/repository";
import { listScoreSegmentsForProfile } from "@/lib/admissions/score-segment-repository";
import type { AdmissionRecord, EnrollmentPlan, ScoreSegment } from "@/lib/admissions/types";
import {
  getCandidateProfileForSession,
  getLatestCandidateProfileForUser,
  listChatSessionsForUser,
  persistChatTurn
} from "@/lib/db/chat-repository";
import { buildRecommendations } from "@/lib/recommendation";
import type { RecommendationCandidate } from "@/lib/recommendation/types";
import { searchSchoolDocumentsForCandidates } from "@/lib/rag/school-document-search";
import type { SchoolDocumentMatch } from "@/lib/rag/school-document-search";
import { extractProfileFromMessage, getMissingProfileFields } from "@/lib/profile";
import type { CandidateProfile as ExtractedProfile, RequiredProfileField } from "@/lib/profile/types";
import { toChatProfile } from "./demo-data";
import type {
  ChatOrchestratorInput,
  ChatOrchestratorResult,
  ChatSummary,
  DataSourceSummary,
  VolunteerCandidate
} from "./types";

export async function runChatOrchestrator({
  message,
  userId,
  sessionId,
  admissionRecords,
  enrollmentPlans,
  existingProfile
}: ChatOrchestratorInput): Promise<ChatOrchestratorResult> {
  const extractedProfile = extractProfileFromMessage(message);
  const profile = mergeCandidateProfiles(
    existingProfile ?? (await getProfileForChatTurn(userId, sessionId)),
    extractedProfile
  );
  const missingFields = getMissingProfileFields(profile);
  const admissionsLookup =
    admissionRecords !== undefined
      ? { records: admissionRecords, dataMode: "empty" as const }
      : await listAdmissionRecordsForProfile(profile);
  const enrollmentPlansLookup =
    enrollmentPlans !== undefined
      ? {
          plans: enrollmentPlans,
          dataMode: enrollmentPlans.length > 0 ? ("sample" as const) : ("empty" as const)
        }
      : await listEnrollmentPlansForProfile(profile);
  const scoreSegmentsLookup = await listScoreSegmentsForProfile(profile);
  const summary = await createRecommendationSummary(
    profile,
    missingFields,
    admissionsLookup,
    enrollmentPlansLookup,
    scoreSegmentsLookup
  );
  const systemContext = buildSystemContext(summary, admissionsLookup.dataMode);
  const generation = await generateAssistantText({
    userMessage: message,
    systemContext,
    grounding: {
      dataMode: admissionsLookup.dataMode,
      summary
    }
  });
  const assistantMessage = {
    id: `assistant-${Date.now()}`,
    role: "assistant" as const,
    content: generation.content,
    createdAt: new Date().toISOString()
  };

  await persistChatTurn({
    userId,
    sessionId,
    userMessage: message,
    assistantMessage,
    profile
  });

  return {
    assistantMessage,
    summary,
    sessions: await listChatSessionsForUser(userId)
  };
}

async function getProfileForChatTurn(
  userId: string,
  sessionId: string | undefined
): Promise<ExtractedProfile | null> {
  if (sessionId) {
    return getCandidateProfileForSession(userId, sessionId);
  }

  return getLatestCandidateProfileForUser(userId);
}

function mergeCandidateProfiles(
  previousProfile: ExtractedProfile | null | undefined,
  nextProfile: ExtractedProfile
): ExtractedProfile {
  if (!previousProfile) {
    return nextProfile;
  }

  return {
    province: "河南",
    score: nextProfile.score ?? previousProfile.score,
    rank: nextProfile.rank ?? previousProfile.rank,
    subjectType: nextProfile.subjectType ?? previousProfile.subjectType,
    eligibleNationalSpecialPlan:
      nextProfile.eligibleNationalSpecialPlan ?? previousProfile.eligibleNationalSpecialPlan,
    preferredRegions: mergeStringLists(previousProfile.preferredRegions, nextProfile.preferredRegions),
    excludedRegions: mergeStringLists(previousProfile.excludedRegions, nextProfile.excludedRegions),
    interestedMajors: mergeStringLists(previousProfile.interestedMajors, nextProfile.interestedMajors),
    excludedMajors: mergeStringLists(previousProfile.excludedMajors, nextProfile.excludedMajors),
    familyResources: mergeOptionalStringLists(previousProfile.familyResources, nextProfile.familyResources),
    budgetConstraints: mergeOptionalStringLists(previousProfile.budgetConstraints, nextProfile.budgetConstraints),
    primaryGoal: nextProfile.primaryGoal ?? previousProfile.primaryGoal
  };
}

function mergeStringLists(previousValues: string[], nextValues: string[]): string[] {
  return [...new Set([...previousValues, ...nextValues])];
}

function mergeOptionalStringLists(
  previousValues: string[] | undefined,
  nextValues: string[] | undefined
): string[] | undefined {
  const merged = mergeStringLists(previousValues ?? [], nextValues ?? []);
  return merged.length > 0 ? merged : undefined;
}

type AdmissionsLookup = {
  records: AdmissionRecord[];
  dataMode: "database" | "sample" | "empty";
};

type EnrollmentPlansLookup = {
  plans: EnrollmentPlan[];
  dataMode: "database" | "sample" | "empty";
};

type ScoreSegmentsLookup = {
  segments: ScoreSegment[];
  nearestSegment: ScoreSegment | null;
  dataMode: "database" | "sample" | "empty";
};

type SchoolDocumentsLookup = {
  matches: SchoolDocumentMatch[];
  dataMode: "database" | "sample" | "empty";
};

async function createRecommendationSummary(
  profile: ExtractedProfile,
  missingFields: RequiredProfileField[],
  admissionsLookup: AdmissionsLookup,
  enrollmentPlansLookup: EnrollmentPlansLookup,
  scoreSegmentsLookup: ScoreSegmentsLookup
): Promise<ChatSummary> {
  const chatProfile = toChatProfile(profile);
  const missingInfo = missingFields.map(toMissingInfoLabel);

  if (missingFields.length > 0) {
    return {
      status: "资料未全",
      profile: chatProfile,
      missingInfo,
      candidates: [],
      sources: buildDataSources(admissionsLookup, enrollmentPlansLookup, scoreSegmentsLookup, {
        matches: [],
        dataMode: "empty"
      }),
      verificationItems: buildVerificationItems(admissionsLookup.dataMode, scoreSegmentsLookup, [])
    };
  }

  if (admissionsLookup.records.length === 0) {
    return {
      status: "数据未导入",
      profile: chatProfile,
      missingInfo: ["结构化招生数据"],
      candidates: [],
      sources: buildDataSources({ records: [], dataMode: "empty" }, enrollmentPlansLookup, scoreSegmentsLookup, {
        matches: [],
        dataMode: "empty"
      }),
      verificationItems: buildVerificationItems("empty", scoreSegmentsLookup, [])
    };
  }

  const recommendations = buildRecommendations(profile, admissionsLookup.records, {
    enrollmentPlans: enrollmentPlansLookup.plans
  });
  const documentLookup = await searchSchoolDocumentsForCandidates(
    recommendations.candidates.map((candidate) => ({
      id: candidate.candidateId,
      schoolName: candidate.schoolName,
      majorName: candidate.majorName ?? "",
      riskTags: candidate.riskTags
    }))
  );

  return {
    status: recommendations.candidates.length > 0 ? "待核验" : "资料未全",
    profile: chatProfile,
    missingInfo: recommendations.candidates.length > 0 ? [] : ["可匹配的招生记录"],
    candidates: recommendations.candidates.map((candidate) =>
      toVolunteerCandidate(candidate, documentLookup.matches)
    ),
    sources: buildDataSources(
      admissionsLookup,
      enrollmentPlansLookup,
      scoreSegmentsLookup,
      documentLookup
    ),
    verificationItems: buildVerificationItems(
      admissionsLookup.dataMode,
      scoreSegmentsLookup,
      documentLookup.matches
    )
  };
}

function buildSystemContext(summary: ChatSummary, dataMode: AdmissionsLookup["dataMode"]): string {
  if (summary.missingInfo.length > 0 && summary.candidates.length === 0) {
    const nextStep =
      dataMode === "empty" ? "先导入 admission_records 后再生成冲稳保候选。" : "";
    return `现在不能做完整冲稳保判断，还缺：${summary.missingInfo.join("、")}。${dataBoundaryText(dataMode)}${nextStep}`;
  }

  const bucketCounts = summary.candidates.reduce<Record<string, number>>((counts, candidate) => {
    counts[candidate.bucket] = (counts[candidate.bucket] ?? 0) + 1;
    return counts;
  }, {});

  return [
    `规则层已基于 admission_records 生成候选：冲 ${bucketCounts["冲"] ?? 0} 个、稳 ${
      bucketCounts["稳"] ?? 0
    } 个、保 ${bucketCounts["保"] ?? 0} 个。`,
    dataBoundaryText(dataMode),
    buildPlanBoundaryText(summary)
  ].join("");
}

function buildPlanBoundaryText(summary: ChatSummary): string {
  const missingPlanCount = summary.candidates.filter((candidate) =>
    candidate.riskTags.includes("缺少当年招生计划")
  ).length;

  if (missingPlanCount === 0) {
    return "候选已匹配当年招生计划时，仍需继续核验招生章程，不能当作最终填报结论。";
  }

  if (missingPlanCount === summary.candidates.length) {
    return "候选仍缺当年招生计划和招生章程核验，不能当作最终填报结论。";
  }

  return "部分候选仍缺当年招生计划，全部候选仍需招生章程核验，不能当作最终填报结论。";
}

function toVolunteerCandidate(
  candidate: RecommendationCandidate,
  documentMatches: SchoolDocumentMatch[]
): VolunteerCandidate {
  const record = candidate.admissionRecord;
  const planEvidence = candidate.enrollmentPlan
    ? `当年计划 ${candidate.enrollmentPlan.planCount} 人。计划来源：${candidate.enrollmentPlan.sourceName}。`
    : "";
  const candidateDocumentMatches = documentMatches.filter(
    (match) => match.candidateId === candidate.candidateId
  );
  const documentEvidence = candidateDocumentMatches[0]
    ? `章程样例提示：${candidateDocumentMatches[0].snippet}。`
    : "";

  return {
    id: candidate.candidateId,
    bucket: candidate.bucket,
    schoolName: candidate.schoolName,
    majorName: candidate.majorName ?? "未标注专业",
    planType: candidate.planType,
    subjectType: record.subjectType,
    city: extractCity(record),
    evidence: `${record.year} 年${record.province}${record.batch}${record.planType}样例/记录：最低分 ${record.minScore ?? "未标注"}，最低位次 ${
      record.minRank ?? "未标注"
    }。来源：${record.sourceName}。${planEvidence}${documentEvidence}`,
    riskTags: [...new Set([...candidate.riskTags, ...candidateDocumentMatches.flatMap((match) => match.riskTags)])],
    status: candidate.missingSources.length > 0 ? "待核验" : "可用"
  };
}

function toAdmissionSource(
  dataMode: AdmissionsLookup["dataMode"],
  recordCount: number
): DataSourceSummary {
  if (dataMode === "sample") {
    return {
      id: "admission-records-sample",
      title: "admission_records 样例 CSV",
      trustLevel: "T5",
      status: "待核验",
      detail: `已加载 ${recordCount} 条样例数据，不用于真实填报；仅用于验证端到端推荐闭环。`
    };
  }

  if (dataMode === "database") {
    return {
      id: "admission-records-db",
      title: "admission_records 数据库记录",
      trustLevel: "T1",
      status: "待核验",
      detail: `已从数据库读取 ${recordCount} 条招生记录；仍需核验当年招生计划和章程。`
    };
  }

  return {
    id: "admission-records-empty",
    title: "admission_records 结构化招生数据",
    trustLevel: "T5",
    status: "资料未全",
    detail: "数据未导入，当前不能生成真实冲稳保候选。"
  };
}

function toEnrollmentPlanSource(
  dataMode: EnrollmentPlansLookup["dataMode"],
  planCount: number
): DataSourceSummary {
  if (dataMode === "sample") {
    return {
      id: "enrollment-plans-sample",
      title: "enrollment_plans 注入样例",
      trustLevel: "T5",
      status: "待核验",
      detail: `已匹配 ${planCount} 条当年招生计划样例；仅用于验证计划变化风险。`
    };
  }

  if (dataMode === "database") {
    return {
      id: "enrollment-plans-db",
      title: "enrollment_plans 数据库记录",
      trustLevel: "T2",
      status: "待核验",
      detail: `已从数据库读取 ${planCount} 条当年招生计划；仍需核验官方来源。`
    };
  }

  return {
    id: "enrollment-plans-empty",
    title: "enrollment_plans 当年招生计划",
    trustLevel: "T5",
    status: "资料未全",
    detail: "当年招生计划未导入，候选只能基于往年位次做初筛。"
  };
}

function toScoreSegmentSource({
  dataMode,
  segments,
  nearestSegment
}: ScoreSegmentsLookup): DataSourceSummary {
  const nearestDetail = nearestSegment
    ? `最近分段：${nearestSegment.score} 分，累计 ${nearestSegment.cumulativeCount.toLocaleString("zh-CN")} 人。`
    : "尚未匹配到当前分数附近的一分一段记录。";

  if (dataMode === "sample") {
    return {
      id: "score-segments-sample",
      title: "score_segments 样例 CSV",
      trustLevel: "T5",
      status: "待核验",
      detail: `已加载 ${segments.length} 条一分一段样例；${nearestDetail}仅用于验证分数/位次上下文，不用于真实填报。`
    };
  }

  if (dataMode === "database") {
    return {
      id: "score-segments-db",
      title: "score_segments 数据库记录",
      trustLevel: "T1",
      status: "待核验",
      detail: `已从数据库读取 ${segments.length} 条一分一段记录；${nearestDetail}仍需核验官方来源。`
    };
  }

  return {
    id: "score-segments-empty",
    title: "score_segments 一分一段表",
    trustLevel: "T5",
    status: "资料未全",
    detail: "一分一段表未导入，暂不能校验分数和位次是否明显不一致。"
  };
}

function toSchoolDocumentSource({ dataMode, matches }: SchoolDocumentsLookup): DataSourceSummary {
  if (dataMode === "sample") {
    return {
      id: "school-documents-sample",
      title: "school_documents 样例 CSV",
      trustLevel: "T5",
      status: "待核验",
      detail: `已命中 ${matches.length} 条章程/资料样例；仅用于验证关键词检索和风险提示，不用于真实填报。`
    };
  }

  if (dataMode === "database") {
    return {
      id: "school-documents-db",
      title: "school_documents 数据库记录",
      trustLevel: "T2",
      status: "待核验",
      detail: `已命中 ${matches.length} 条高校资料；仍需回查高校官方原文。`
    };
  }

  return {
    id: "school-documents-empty",
    title: "school_documents 招生章程",
    trustLevel: "T5",
    status: "资料未全",
    detail: "招生章程样例/数据未命中，体检、单科、校区、学费和调剂规则仍需人工核验。"
  };
}

function buildDataSources(
  admissionsLookup: AdmissionsLookup,
  enrollmentPlansLookup: EnrollmentPlansLookup,
  scoreSegmentsLookup: ScoreSegmentsLookup,
  schoolDocumentsLookup: SchoolDocumentsLookup
): DataSourceSummary[] {
  return [
    toAdmissionSource(admissionsLookup.dataMode, admissionsLookup.records.length),
    toEnrollmentPlanSource(enrollmentPlansLookup.dataMode, enrollmentPlansLookup.plans.length),
    toScoreSegmentSource(scoreSegmentsLookup),
    toSchoolDocumentSource(schoolDocumentsLookup)
  ];
}

function buildVerificationItems(
  dataMode: AdmissionsLookup["dataMode"],
  scoreSegmentsLookup: ScoreSegmentsLookup,
  documentMatches: SchoolDocumentMatch[]
): string[] {
  const items = [
    "用河南省教育考试院官方数据核对近三年最低位次。",
    buildScoreSegmentVerificationItem(scoreSegmentsLookup),
    buildSchoolDocumentVerificationItem(documentMatches),
    "确认当年招生计划、校区、学费和专业名称是否变化。"
  ];

  if (dataMode === "sample") {
    return ["当前为样例数据，不用于真实填报。", ...items];
  }

  if (dataMode === "empty") {
    return ["先导入 admission_records 后再生成冲稳保候选。", ...items];
  }

  return items;
}

function buildScoreSegmentVerificationItem(scoreSegmentsLookup: ScoreSegmentsLookup): string {
  if (scoreSegmentsLookup.nearestSegment) {
    return `用官方一分一段表核对分数和位次；当前样例最近分段为 ${scoreSegmentsLookup.nearestSegment.score} 分、累计 ${scoreSegmentsLookup.nearestSegment.cumulativeCount.toLocaleString("zh-CN")} 人。`;
  }

  return "导入官方一分一段表后，核对用户分数和位次是否明显不一致。";
}

function buildSchoolDocumentVerificationItem(documentMatches: SchoolDocumentMatch[]): string {
  if (documentMatches.length === 0) {
    return "回查高校招生章程中的体检、单科、外语语种和调剂规则。";
  }

  const firstMatch = documentMatches[0];
  return `回查高校招生章程原文；当前关键词样例命中 ${firstMatch.schoolName}：${firstMatch.snippet}`;
}

function dataBoundaryText(dataMode: AdmissionsLookup["dataMode"]): string {
  if (dataMode === "sample") {
    return "当前使用样例数据，不用于真实填报。";
  }

  if (dataMode === "empty") {
    return "结构化招生数据未导入，不能编造候选、分数线、位次或计划数。";
  }

  return "当前使用数据库招生记录，仍需核验官方来源和当年计划。";
}

function toMissingInfoLabel(field: RequiredProfileField): string {
  const labels: Record<RequiredProfileField, string> = {
    score: "高考分数",
    rank: "全省位次",
    subjectType: "科类：物理类或历史类",
    primaryGoal: "核心诉求：稳妥、就业、考研、城市等"
  };

  return labels[field];
}

function extractCity(record: AdmissionRecord): string {
  const text = [record.schoolName, record.notes].filter(Boolean).join(" ");
  const knownCities = ["郑州", "开封", "洛阳", "焦作", "新乡", "安阳", "南阳", "信阳"];
  return knownCities.find((city) => text.includes(city)) ?? "待核验";
}
