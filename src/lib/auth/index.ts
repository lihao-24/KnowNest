"use client";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export const LOGIN_FAILED_MESSAGE = "登录失败，请检查邮箱和密码。";
export const LOGOUT_FAILED_MESSAGE = "退出登录失败，请稍后重试。";

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

export async function signOutCurrentUser() {
  const supabase = createBrowserSupabaseClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(LOGOUT_FAILED_MESSAGE);
  }
}
