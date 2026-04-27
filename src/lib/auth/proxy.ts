import type { NextRequest } from "next/server";

import {
  createProxySupabaseClient,
  createRedirectResponse,
} from "@/lib/supabase/proxy";

export async function getCurrentUserForProxy(request: NextRequest) {
  const proxyClient = createProxySupabaseClient(request);
  const {
    data: { user },
  } = await proxyClient.supabase.auth.getUser();

  return {
    user,
    response: proxyClient.response,
  };
}

export { createRedirectResponse };
