export function LoginPageShell({
  error,
  redirectTo
}: {
  error: string | null;
  redirectTo: string;
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

        <div className="localBadge">服务端认证 · 不接收客户端 user_id</div>
        <p className="loginDisclaimer">
          数据建议仅供辅助，最终以河南省教育考试院和高校招生章程为准。
        </p>
      </section>

      <section className="loginPanel" aria-label="登录入口">
        <form className="loginCard" action="/auth/sign-in" method="post" data-testid="login-form">
          <input name="redirectTo" type="hidden" value={redirectTo} />
          <div>
            <p className="eyebrow">SIGN IN</p>
            <h2>进入志愿问答工作台</h2>
            <p>
              使用统一 Supabase Auth 登录。登录后，服务端会从 session 获取用户身份。
            </p>
          </div>

          <div className="loginFields">
            <label className="field">
              <span>邮箱</span>
              <input
                autoComplete="email"
                data-testid="login-email"
                name="email"
                placeholder="you@example.com"
                required
                type="email"
              />
            </label>

            <label className="field">
              <span>密码</span>
              <input
                autoComplete="current-password"
                data-testid="login-password"
                name="password"
                required
                type="password"
              />
            </label>
          </div>

          {error ? <p className="formError">{error}</p> : null}

          <button className="primaryButton" type="submit" data-testid="login-submit">
            登录
          </button>

          <div className="loginNotes">
            <div>
              <strong>真实身份边界</strong>
              <span>工作台和 API 只信任服务端认证得到的 Supabase user id。</span>
            </div>
          </div>
        </form>
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
