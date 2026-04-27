import "server-only";

import { createClient } from "@supabase/supabase-js";

function readSupabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    const missing = [
      supabaseUrl ? null : "NEXT_PUBLIC_SUPABASE_URL",
      supabaseAnonKey ? null : "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ].filter((name): name is string => Boolean(name));

    throw new Error(
      `Missing Supabase environment variable${missing.length > 1 ? "s" : ""}: ${missing.join(
        ", ",
      )}. Add them to .env.local and restart the Next.js server.`,
    );
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
  };
}

export function createServerSupabaseClient() {
  const { supabaseUrl, supabaseAnonKey } = readSupabaseEnv();

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
