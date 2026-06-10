import { LoginPageShell } from "@/components/LoginPageShell";
import { sanitizeRedirectPath } from "@/lib/auth/server";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    redirectTo?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  invalid_credentials: "邮箱或密码不正确，请检查后重试。"
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const redirectTo = sanitizeRedirectPath(params?.redirectTo ?? "/workspace");
  const error = params?.error ? (errorMessages[params.error] ?? "登录失败，请稍后重试。") : null;

  return <LoginPageShell error={error} redirectTo={redirectTo} />;
}
