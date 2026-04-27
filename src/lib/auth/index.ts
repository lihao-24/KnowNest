"use client";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export const LOGIN_FAILED_MESSAGE = "登录失败，请检查邮箱和密码。";

export type EmailPasswordCredentials = {
  email: string;
  password: string;
};

export async function signInWithEmailPassword({
  email,
  password,
}: EmailPasswordCredentials) {
  const supabase = createBrowserSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(LOGIN_FAILED_MESSAGE);
  }
}
