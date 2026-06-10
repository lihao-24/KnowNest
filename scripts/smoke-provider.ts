import { hasEnvVars, startNextDevServer, withBrowser } from "./smoke-utils";

const requiredEnv = [
  "AI_DEFAULT_PROVIDER",
  "AI_PROVIDER_BASE_URL",
  "AI_PROVIDER_API_KEY",
  "AI_PROVIDER_MODEL"
];

async function main() {
  if (process.env.AI_DEFAULT_PROVIDER !== "openai-compatible" || !hasEnvVars(requiredEnv)) {
    console.log("provider smoke skipped: required OpenAI-compatible provider env vars are not all set");
    return;
  }

  const server = await startNextDevServer({
    DATABASE_URL: "disabled",
    DEMO_AUTH_ENABLED: "true",
    NEXT_PUBLIC_SUPABASE_URL: "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: ""
  });

  try {
    await withBrowser(async (page) => {
      await page.goto(`${server.baseUrl}/workspace`);
      await page.getByRole("heading", { name: "当前咨询" }).waitFor();
      await page
        .getByTestId("chat-input")
        .fill("河南理科 580 分，位次 3 万，没有国家专项资格，想省内稳一点");
      await page.getByTestId("send-button").click();
      await page.getByTestId("candidate-card").first().waitFor();
      await page.getByTestId("message-assistant").last().waitFor();
    });
  } finally {
    await server.stop();
  }

  console.log("provider smoke passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
