import type { NextRequest } from "next/server";

import {
  createRedirectResponse,
  getCurrentUserForProxy,
} from "@/lib/auth/proxy";
import { getAuthRedirect } from "@/lib/auth/route-protection";

export async function proxy(request: NextRequest) {
  const { user, response } = await getCurrentUserForProxy(request);
  const redirectPath = getAuthRedirect(
    request.nextUrl.pathname,
    Boolean(user),
  );

  if (redirectPath) {
    return createRedirectResponse(request, redirectPath, response);
  }

  return response;
}

export const config = {
  matcher: ["/app", "/app/:path*", "/login"],
};
