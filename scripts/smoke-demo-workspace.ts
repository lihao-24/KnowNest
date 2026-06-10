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
      await page.getByText("score_segments 样例 CSV").waitFor();
      await page.getByText("school_documents 样例 CSV").waitFor();

      const firstSaveButton = page.getByTestId(/^save-choice-/).first();
      await firstSaveButton.click();
      await firstSaveButton.filter({ hasText: "已保存" }).waitFor();
      await firstSaveButton.click();
      await firstSaveButton.filter({ hasText: "保存" }).waitFor();

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
      await page.getByTestId("edit-profile-button").click();
      await page.getByTestId("profile-score").fill("590");
      await page.getByTestId("profile-rank").fill("26000");
      await page.getByTestId("profile-subject").selectOption("物理类");
      await page.getByTestId("profile-national-special").selectOption("false");
      await page.getByTestId("profile-goal").selectOption("就业");
      await page.getByTestId("profile-regions").fill("郑州、洛阳");
      await page.getByTestId("profile-majors").fill("计算机");
      await page.getByTestId("save-profile-button").click();
      await page.getByTestId("profile-summary").getByText("590").waitFor();
      await page.getByTestId("profile-summary").getByText("26,000").waitFor();
      await page.getByTestId("profile-summary").getByText("就业").waitFor();

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
