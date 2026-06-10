import { redirect } from "next/navigation";
import { createServerSupabaseClient, sanitizeRedirectPath } from "@/lib/auth/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = sanitizeRedirectPath(formData.get("redirectTo"));

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    redirect(`/login?error=invalid_credentials&redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  redirect(redirectTo);
}
