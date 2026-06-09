import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";

export type AuthenticatedUser = {
  id: string;
  email: string | null;
  isDemo: boolean;
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
  if (!hasSupabaseConfig()) {
    return isDemoAuthEnabled() ? demoUser : null;
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
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
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    return mapSupabaseUser(user);
  }

  return isDemoAuthEnabled() ? demoUser : null;
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
