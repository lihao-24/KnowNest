import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

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

export function createProxySupabaseClient(request: NextRequest) {
  const { supabaseUrl, supabaseAnonKey } = readSupabaseEnv();
  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });

        Object.entries(headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      },
    },
  });

  return {
    supabase,
    get response() {
      return response;
    },
  };
}

export function createRedirectResponse(
  request: NextRequest,
  destination: string,
  sourceResponse: NextResponse,
) {
  const redirectResponse = NextResponse.redirect(
    new URL(destination, request.url),
  );

  sourceResponse.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "set-cookie") {
      redirectResponse.headers.set(key, value);
    }
  });

  sourceResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}
