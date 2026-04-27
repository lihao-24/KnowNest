import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export const AUTH_REQUIRED_MESSAGE = "请先登录后再继续操作。";

export type CurrentUser = {
  id: string;
  email: string | null;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? null,
  };
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error(AUTH_REQUIRED_MESSAGE);
  }

  return user;
}
