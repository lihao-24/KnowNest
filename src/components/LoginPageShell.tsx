import Link from "next/link";

export function LoginPageShell({
  demoEnabled,
  supabaseEnabled
}: {
  demoEnabled: boolean;
  supabaseEnabled: boolean;
}) {
  return (
    <main className="loginPage">
      <section className="loginIntro" aria-labelledby="login-title">
        <div className="brandMark" aria-hidden="true">
          豫
        </div>
        <div>
          <p className="eyebrow">HENAN GAOKAO ADVISOR</p>
          <h1 id="login-title">河南志愿 AI 助手</h1>
          <p className="loginSubtitle">
            出分后，用河南官方数据辅助筛选本科批与国家专项志愿。
          </p>
        </div>

        <div className="trustStack" aria-label="可信边界">
          <p className="trustLabel">TRUST · 为什么可信</p>
          <TrustRow title="官方优先" detail="分数、位次、招生计划优先回到 T1/T2 来源。" />
          <TrustRow title="规则先行" detail="冲稳保候选先由服务端规则筛选，AI 只负责解释。" />
          <TrustRow title="风险留痕" detail="资料未全、待确认、待核验会直接展示在工作台右侧。" />
        </div>

        <div className="localBadge">本地优先 · 不接收客户端 user_id</div>
        <p className="loginDisclaimer">
          数据建议仅供辅助，最终以河南省教育考试院和高校招生章程为准。
        </p>
      </section>

      <section className="loginPanel" aria-label="登录入口">
        <div className="loginCard">
          <div>
            <p className="eyebrow">SIGN IN</p>
            <h2>进入志愿问答工作台</h2>
            <p>
              第一版复用 Supabase Auth；本地开发可开启 demo auth 直接查看受保护页面。
            </p>
          </div>

          <div className="loginActions">
            {demoEnabled ? (
              <Link className="primaryButton" href="/workspace">
                本地演示入口
              </Link>
            ) : (
              <button className="primaryButton" type="button" disabled>
                本地演示未开启
              </button>
            )}

            <button className="secondaryButton" type="button" disabled={!supabaseEnabled}>
              Supabase 登录入口
            </button>
          </div>

          <div className="loginNotes">
            <div>
              <strong>{supabaseEnabled ? "Supabase 已配置" : "Supabase 未配置"}</strong>
              <span>真实登录会通过服务端 session 获取用户身份。</span>
            </div>
            <div>
              <strong>{demoEnabled ? "Demo Auth 已开启" : "Demo Auth 未开启"}</strong>
              <span>设置 DEMO_AUTH_ENABLED=true 可进入本地工作台。</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function TrustRow({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="trustRow">
      <span aria-hidden="true" />
      <div>
        <strong>{title}</strong>
        <p>{detail}</p>
      </div>
    </div>
  );
}
