import { LoginPageShell } from "@/components/LoginPageShell";
import { hasSupabaseConfig, isDemoAuthEnabled } from "@/lib/auth/server";

export default function LoginPage() {
  return (
    <LoginPageShell
      demoEnabled={isDemoAuthEnabled()}
      supabaseEnabled={hasSupabaseConfig()}
    />
  );
}
