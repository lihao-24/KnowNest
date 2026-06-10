import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";

export type AuthenticatedUser = {
  id: string;
  email: string | null;
  isDemo: boolean;
};

export type AuthResolutionInput = {
  supabaseConfigured: boolean;
  demoEnabled: boolean;
  supabaseUser: User | null;
};

const demoUser: AuthenticatedUser = {
  id: "demo-user",
  email: "demo@henan-gaokao.local",
  isDemo: true
};

export function isDemoAuthEnabled(): boolean {
  return process.env.DEMO_AUTH_ENABLED === "true";
}

export function hasSupabaseConfig(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const supabaseConfigured = hasSupabaseConfig();

  if (!supabaseConfigured) {
    return resolveAuthenticatedUser({
      supabaseConfigured,
      demoEnabled: isDemoAuthEnabled(),
      supabaseUser: null
    });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return resolveAuthenticatedUser({
    supabaseConfigured,
    demoEnabled: isDemoAuthEnabled(),
    supabaseUser: user
  });
}

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            try {
              cookieStore.set(name, value, options);
            } catch {
              // Server Components can read auth cookies but may not be able to refresh them.
            }
          });
        }
      }
    }
  );
}

export async function requireAuthenticatedUser(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

function mapSupabaseUser(user: User): AuthenticatedUser {
  return {
    id: user.id,
    email: user.email ?? null,
    isDemo: false
  };
}

export function resolveAuthenticatedUser({
  supabaseConfigured,
  demoEnabled,
  supabaseUser
}: AuthResolutionInput): AuthenticatedUser | null {
  if (supabaseUser) {
    return mapSupabaseUser(supabaseUser);
  }

  if (!supabaseConfigured && demoEnabled) {
    return demoUser;
  }

  return null;
}

export function sanitizeRedirectPath(value: FormDataEntryValue | string | null): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return "/workspace";
  }

  return value;
}
