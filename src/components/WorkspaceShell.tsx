"use client";

import type { FormEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import { StatusPill } from "@/components/StatusPill";
import type {
  AuthenticatedUser,
  ChatMessage,
  ChatSession,
  ChatSummary
} from "@/components/workspace-types";

type WorkspaceShellProps = {
  user: AuthenticatedUser;
  initialSessions: ChatSession[];
  initialSummary: ChatSummary;
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

export function WorkspaceShell({
  user,
  initialSessions,
  initialSummary
}: WorkspaceShellProps) {
  const [sessions, setSessions] = useState(initialSessions);
  const [summary, setSummary] = useState(initialSummary);
  const [messages, setMessages] = useState<ChatMessage[]>(starterMessages);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const canSend = message.trim().length > 0 && !isSending;
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
        body: JSON.stringify({ message: userMessage.content })
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
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          content: "这轮服务端调用失败了。请稍后重试，或先检查本地 API 和登录状态。",
          createdAt: new Date().toISOString()
        }
      ]);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <main className="workspacePage">
      <aside className="workspaceSidebar" aria-label="会话列表">
        <div className="sidebarHeader">
          <p className="eyebrow">WORKSPACE</p>
          <h1>志愿问答</h1>
        </div>

        <button className="newChatButton" type="button">
          新建会话
        </button>

        <p className="sidebarLabel">最近会话</p>
        <nav className="conversationList">
          {sessions.map((session) => (
            <button className="conversationItem" type="button" key={session.id}>
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
          {messages.map((chatMessage) => (
            <article
              className={`messageBubble messageBubble--${chatMessage.role}`}
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
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="例如：河南理科 580 分，位次 3 万，想省内稳一点"
              rows={3}
            />
            <button className="sendButton" type="submit" disabled={!canSend}>
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

        <SummarySection title="考生画像">
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
                <article className="candidateCard" key={candidate.id}>
                  <div>
                    <strong>
                      {candidate.bucket} · {candidate.schoolName}
                    </strong>
                    <span>
                      {candidate.majorName} · {candidate.city}
                    </span>
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
  children
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="summarySection">
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
