import { assert, startNextDevServer, withBrowser } from "./smoke-utils";

async function main() {
  const server = await startNextDevServer({
    DATABASE_URL: "disabled",
    DEMO_AUTH_ENABLED: "true",
    NEXT_PUBLIC_SUPABASE_URL: "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
    AI_DEFAULT_PROVIDER: "",
    AI_PROVIDER_BASE_URL: "",
    AI_PROVIDER_API_KEY: "",
    AI_PROVIDER_MODEL: ""
  });

  try {
    await withBrowser(async (page) => {
      await page.goto(`${server.baseUrl}/workspace`);
      await page.getByRole("heading", { name: "当前咨询" }).waitFor();
      await page.getByText("demo@henan-gaokao.local").waitFor();

      const firstSessionId = await page.getByTestId("session-item-0").getAttribute("data-session-id");
      assert(firstSessionId, "default demo session should expose a session id");

      await page
        .getByTestId("chat-input")
        .fill("河南理科 580 分，位次 3 万，没有国家专项资格，想省内稳一点");
      await page.getByTestId("send-button").click();

      await page.getByTestId("message-assistant").filter({ hasText: "初筛方向" }).waitFor();
      await page.getByTestId("profile-summary").getByText("30,000").waitFor();
      await page.getByTestId("profile-summary").getByText("物理类", { exact: true }).waitFor();
      await page.getByTestId("candidate-card").first().waitFor();
      await page.getByText("样例数据，不用于真实填报").first().waitFor();

      await page.getByTestId("new-session-button").click();
      await page.getByTestId("chat-input").waitFor();
      await page.waitForFunction(
        (previousSessionId) =>
          document.querySelector('[data-testid="session-item-0"]')?.getAttribute("data-session-id") !==
          previousSessionId,
        firstSessionId
      );
      const newSessionId = await page.getByTestId("session-item-0").getAttribute("data-session-id");
      assert(newSessionId && newSessionId !== firstSessionId, "new session should become active");
      await page.getByText("资料未全，暂不生成完整候选。").waitFor();

      await page.locator(`[data-session-id="${firstSessionId}"]`).click();
      await page
        .getByTestId("message-user")
        .filter({ hasText: "河南理科 580 分，位次 3 万" })
        .waitFor();
      await page.getByTestId("profile-summary").getByText("30,000").waitFor();
    });
  } finally {
    await server.stop();
  }

  console.log("demo workspace smoke passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
