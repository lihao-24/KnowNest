"use client";

import type { FormEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import { StatusPill } from "@/components/StatusPill";
import type {
  AuthenticatedUser,
  ChatMessage,
  ChatSession,
  ChatSummary,
  SavedChoice
} from "@/components/workspace-types";

type WorkspaceShellProps = {
  user: AuthenticatedUser;
  initialSessions: ChatSession[];
  initialSummary: ChatSummary;
  initialSavedChoices: SavedChoice[];
};

const starterMessages: ChatMessage[] = [
  {
    id: "assistant-welcome",
    role: "assistant",
    content:
      "先把考生硬信息补齐：河南、科类、分数、位次、国家专项资格和核心诉求。资料不全时，我只会追问，不会编冲稳保结论。",
    createdAt: new Date().toISOString()
  }
];

const quickPrompts = ["生成冲稳保方案", "解释国家专项风险", "对比省内稳妥选择"];

let transientMessageId = 0;

export function WorkspaceShell({
  user,
  initialSessions,
  initialSummary,
  initialSavedChoices
}: WorkspaceShellProps) {
  const [sessions, setSessions] = useState(initialSessions);
  const [activeSessionId, setActiveSessionId] = useState(initialSessions[0]?.id ?? null);
  const [summary, setSummary] = useState(initialSummary);
  const [messages, setMessages] = useState<ChatMessage[]>(starterMessages);
  const [savedChoiceIds, setSavedChoiceIds] = useState(
    () => new Set(initialSavedChoices.map((choice) => choice.candidateId))
  );
  const [savingCandidateId, setSavingCandidateId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const canSend = message.trim().length > 0 && !isSending && !isLoadingSession;
  const knownProfileCount = useMemo(
    () =>
      [
        summary.profile.score,
        summary.profile.rank,
        summary.profile.subjectType,
        summary.profile.eligibleNationalSpecialPlan,
        summary.profile.primaryGoal
      ].filter((value) => value !== null).length,
    [summary.profile]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSend) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: message.trim(),
      createdAt: new Date().toISOString()
    };

    setMessages((current) => [...current, userMessage]);
    setMessage("");
    setIsSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: userMessage.content,
          sessionId: activeSessionId ?? undefined,
          profile: summary.profile
        })
      });

      if (!response.ok) {
        throw new Error("chat request failed");
      }

      const result = (await response.json()) as {
        assistantMessage: ChatMessage;
        summary: ChatSummary;
        sessions: ChatSession[];
      };

      setMessages((current) => [...current, result.assistantMessage]);
      setSummary(result.summary);
      setSessions(result.sessions);
      setActiveSessionId(result.sessions[0]?.id ?? activeSessionId);
    } catch {
      setMessages((current) => [
        ...current,
        createTransientAssistantMessage("这轮服务端调用失败了。请稍后重试，或先检查本地 API 和登录状态。")
      ]);
    } finally {
      setIsSending(false);
    }
  }

  async function handleCreateSession() {
    setIsLoadingSession(true);

    try {
      const response = await fetch("/api/chat/sessions", {
        method: "POST"
      });

      if (!response.ok) {
        throw new Error("create session failed");
      }

      const result = (await response.json()) as {
        session: ChatSession;
        sessions: ChatSession[];
      };

      setSessions(result.sessions);
      setActiveSessionId(result.session.id);
      setSummary(initialSummary);
      setMessages(starterMessages);
      setMessage("");
    } catch {
      setMessages([
        createTransientAssistantMessage("新建会话失败了。请稍后重试，或先检查本地数据库连接。")
      ]);
    } finally {
      setIsLoadingSession(false);
    }
  }

  async function handleSelectSession(sessionId: string) {
    if (sessionId === activeSessionId || isLoadingSession) {
      return;
    }

    setIsLoadingSession(true);

    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}`);

      if (!response.ok) {
        throw new Error("load session failed");
      }

      const result = (await response.json()) as {
        messages: ChatMessage[];
        summary: ChatSummary;
      };

      setActiveSessionId(sessionId);
      setSummary(result.summary);
      setMessages(result.messages.length > 0 ? result.messages : starterMessages);
      setMessage("");
    } catch {
      setMessages([
        createTransientAssistantMessage("加载会话失败了。请稍后重试，或先检查本地 API 和登录状态。")
      ]);
    } finally {
      setIsLoadingSession(false);
    }
  }

  async function handleToggleCandidate(candidate: ChatSummary["candidates"][number]) {
    if (savingCandidateId) {
      return;
    }

    const isSaved = savedChoiceIds.has(candidate.id);
    setSavingCandidateId(candidate.id);

    try {
      const response = await fetch(
        isSaved ? `/api/saved-choices/${encodeURIComponent(candidate.id)}` : "/api/saved-choices",
        {
          method: isSaved ? "DELETE" : "POST",
          headers: isSaved
            ? undefined
            : {
                "Content-Type": "application/json"
              },
          body: isSaved
            ? undefined
            : JSON.stringify({
                sessionId: activeSessionId,
                candidateId: candidate.id,
                schoolName: candidate.schoolName,
                majorName: candidate.majorName,
                batch: "本科批",
                planType: candidate.planType,
                bucket: candidate.bucket,
                rationale: candidate.evidence,
                riskTags: candidate.riskTags,
                sources: summary.sources
              })
        }
      );

      if (!response.ok) {
        throw new Error("save choice request failed");
      }

      setSavedChoiceIds((current) => {
        const next = new Set(current);
        if (isSaved) {
          next.delete(candidate.id);
        } else {
          next.add(candidate.id);
        }

        return next;
      });
    } catch {
      setMessages((current) => [
        ...current,
        createTransientAssistantMessage("志愿篮保存状态更新失败。请稍后重试，或先检查本地 API 和登录状态。")
      ]);
    } finally {
      setSavingCandidateId(null);
    }
  }

  return (
    <main className="workspacePage">
      <aside className="workspaceSidebar" aria-label="会话列表">
        <div className="sidebarHeader">
          <p className="eyebrow">WORKSPACE</p>
          <h1>志愿问答</h1>
        </div>

        <button
          className="newChatButton"
          data-testid="new-session-button"
          type="button"
          onClick={handleCreateSession}
          disabled={isLoadingSession}
        >
          {isLoadingSession ? "处理中" : "新建会话"}
        </button>

        <p className="sidebarLabel">最近会话</p>
        <nav className="conversationList">
          {sessions.map((session, index) => (
            <button
              className={`conversationItem ${
                session.id === activeSessionId ? "conversationItem--active" : ""
              }`}
              data-session-id={session.id}
              data-testid={`session-item-${index}`}
              type="button"
              key={session.id}
              onClick={() => handleSelectSession(session.id)}
              disabled={isLoadingSession}
            >
              <span>
                <strong>{session.title}</strong>
                <small>{session.preview}</small>
              </span>
              <span className="conversationMeta">
                <StatusPill status={session.status} />
                <time>{session.updatedAt}</time>
              </span>
            </button>
          ))}
        </nav>

        <div className="accountBox">
          <div className="avatar" aria-hidden="true">
            {user.email?.slice(0, 1).toUpperCase() ?? "U"}
          </div>
          <div>
            <strong>已登录用户</strong>
            <span>{user.email ?? user.id}</span>
          </div>
          <form action="/auth/logout" method="post">
            <button className="logoutButton" type="submit">
              退出
            </button>
          </form>
        </div>
      </aside>

      <section className="chatColumn" aria-label="聊天问答">
        <header className="chatHeader">
          <div>
            <p className="eyebrow">河南 · 本科批 / 国家专项</p>
            <h2>当前咨询</h2>
          </div>
          <div className="headerFacts">
            <StatusPill status={summary.status} />
            <span>{knownProfileCount}/5 项硬信息</span>
          </div>
        </header>

        <div className="messageList">
          {isLoadingSession ? <p className="loadingText">正在加载会话...</p> : null}
          {messages.map((chatMessage) => (
            <article
              className={`messageBubble messageBubble--${chatMessage.role}`}
              data-testid={`message-${chatMessage.role}`}
              key={chatMessage.id}
            >
              <span>{chatMessage.role === "assistant" ? "助手" : "你"}</span>
              <p>{chatMessage.content}</p>
            </article>
          ))}
        </div>

        <form className="chatInputArea" onSubmit={handleSubmit}>
          <div className="quickPrompts" aria-label="快捷提示">
            {quickPrompts.map((prompt) => (
              <button
                type="button"
                key={prompt}
                onClick={() => setMessage(prompt)}
                disabled={isSending}
              >
                {prompt}
              </button>
            ))}
          </div>
          <div className="composer">
            <textarea
              data-testid="chat-input"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="例如：河南理科 580 分，位次 3 万，想省内稳一点"
              rows={3}
            />
            <button className="sendButton" data-testid="send-button" type="submit" disabled={!canSend}>
              {isSending ? "处理中" : "发送"}
            </button>
          </div>
        </form>
      </section>

      <aside className="summaryPanel" aria-label="当前总结区">
        <header>
          <p className="eyebrow">CURRENT SUMMARY</p>
          <h2>当前总结区</h2>
          <div className="summaryStatus">
            <StatusPill status={summary.status} />
            <p>{getSummaryStatusDetail(summary)}</p>
          </div>
        </header>

        <SummarySection title="考生画像" testId="profile-summary">
          <InfoGrid
            rows={[
              ["省份", summary.profile.province],
              ["分数", summary.profile.score?.toString() ?? "待补充"],
              ["位次", summary.profile.rank?.toLocaleString("zh-CN") ?? "待补充"],
              ["科类", summary.profile.subjectType ?? "待补充"],
              [
                "国家专项",
                summary.profile.eligibleNationalSpecialPlan === null
                  ? "待确认"
                  : summary.profile.eligibleNationalSpecialPlan
                    ? "具备"
                    : "不具备"
              ],
              ["核心诉求", summary.profile.primaryGoal ?? "待补充"]
            ]}
          />
        </SummarySection>

        <SummarySection title="缺失信息">
          <TagList items={summary.missingInfo} emptyText="硬信息已基本补齐" />
        </SummarySection>

        <SummarySection title="候选清单">
          {summary.candidates.length === 0 ? (
            <p className="emptyText">{getEmptyCandidateText(summary.status)}</p>
          ) : (
            <div className="candidateList">
              {summary.candidates.map((candidate) => (
                <article className="candidateCard" data-testid="candidate-card" key={candidate.id}>
                  <div className="candidateHeader">
                    <div>
                      <strong>
                        {candidate.bucket} · {candidate.schoolName}
                      </strong>
                      <span>
                        {candidate.majorName} · {candidate.city}
                      </span>
                    </div>
                    <button
                      className="saveChoiceButton"
                      data-testid={`save-choice-${candidate.id}`}
                      type="button"
                      onClick={() => handleToggleCandidate(candidate)}
                      disabled={savingCandidateId !== null}
                    >
                      {savingCandidateId === candidate.id
                        ? "处理中"
                        : savedChoiceIds.has(candidate.id)
                          ? "已保存"
                          : "保存"}
                    </button>
                  </div>
                  <StatusPill status={candidate.status} />
                  <p>{candidate.evidence}</p>
                  <TagList items={candidate.riskTags} emptyText="暂无风险标签" />
                </article>
              ))}
            </div>
          )}
        </SummarySection>

        <SummarySection title="数据来源">
          <div className="sourceList">
            {summary.sources.map((source) => (
              <article key={source.id}>
                <div>
                  <strong>{source.title}</strong>
                  <StatusPill status={source.status} />
                </div>
                <span>{source.trustLevel}</span>
                <p>{source.detail}</p>
              </article>
            ))}
          </div>
        </SummarySection>

        <SummarySection title="待核验事项">
          <ol className="verificationList">
            {summary.verificationItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </SummarySection>
      </aside>
    </main>
  );
}

function createTransientAssistantMessage(content: string): ChatMessage {
  transientMessageId += 1;

  return {
    id: `assistant-transient-${transientMessageId}`,
    role: "assistant",
    content,
    createdAt: new Date().toISOString()
  };
}

function getSummaryStatusDetail(summary: ChatSummary): string {
  if (summary.status === "数据未导入") {
    return "结构化招生数据还不可用，只能解释规则和数据准备，不生成冲稳保。";
  }

  if (summary.status === "资料未全") {
    return `还缺 ${summary.missingInfo.length} 项硬信息，先追问再推荐。`;
  }

  if (summary.status === "待确认") {
    return "用户口径或偏好还需要确认，暂不作为最终判断。";
  }

  if (summary.status === "待核验") {
    return "已形成初筛候选，但招生计划、章程和官方来源仍需核验。";
  }

  return "当前结构化数据可用，仍需按官方系统做最终确认。";
}

function getEmptyCandidateText(status: ChatSummary["status"]): string {
  if (status === "数据未导入") {
    return "数据未导入，当前不生成冲稳保候选。";
  }

  if (status === "资料未全") {
    return "资料未全，暂不生成完整候选。";
  }

  return "当前条件下没有可展示候选。";
}

function SummarySection({
  title,
  children,
  testId
}: {
  title: string;
  children: ReactNode;
  testId?: string;
}) {
  return (
    <section className="summarySection" data-testid={testId}>
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function InfoGrid({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="infoGrid">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function TagList({ items, emptyText }: { items: string[]; emptyText: string }) {
  if (items.length === 0) {
    return <p className="emptyText">{emptyText}</p>;
  }

  return (
    <div className="tagList">
      {items.map((item) => (
        <span key={item}>{item}</span>
      ))}
    </div>
  );
}
