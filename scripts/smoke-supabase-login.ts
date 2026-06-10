import { assert, hasEnvVars, startNextDevServer, withBrowser } from "./smoke-utils";

const requiredEnv = [
  "E2E_SUPABASE_EMAIL",
  "E2E_SUPABASE_PASSWORD",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
];

async function main() {
  if (!hasEnvVars(requiredEnv)) {
    console.log("supabase login smoke skipped: required E2E Supabase env vars are not all set");
    return;
  }

  const server = await startNextDevServer({
    DATABASE_URL: "disabled",
    DEMO_AUTH_ENABLED: "false",
    AI_DEFAULT_PROVIDER: "",
    AI_PROVIDER_BASE_URL: "",
    AI_PROVIDER_API_KEY: "",
    AI_PROVIDER_MODEL: ""
  });

  try {
    await withBrowser(async (page) => {
      await page.goto(`${server.baseUrl}/login?redirectTo=/workspace`);
      await page.getByTestId("login-email").fill(process.env.E2E_SUPABASE_EMAIL ?? "");
      await page.getByTestId("login-password").fill(process.env.E2E_SUPABASE_PASSWORD ?? "");
      await page.getByTestId("login-submit").click();
      await page.waitForURL("**/workspace", { timeout: 30_000 });
      await page.getByRole("heading", { name: "当前咨询" }).waitFor();

      const response = await page.request.get(`${server.baseUrl}/api/auth/me`);
      assert(response.status() === 200, `/api/auth/me should return 200 after login, got ${response.status()}`);
      const body = (await response.json()) as { user?: { id?: string; isDemo?: boolean } };
      assert(body.user?.id, "/api/auth/me should return a user id after login");
      assert(body.user.isDemo === false, "Supabase smoke should not use demo auth");
    });
  } finally {
    await server.stop();
  }

  console.log("supabase login smoke passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
