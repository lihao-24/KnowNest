export function isProtectedAppPath(pathname: string) {
  return pathname === "/app" || pathname.startsWith("/app/");
}

export function getAuthRedirect(
  pathname: string,
  isAuthenticated: boolean,
): string | null {
  if (pathname === "/") {
    return isAuthenticated ? "/app" : "/login";
  }

  if (isProtectedAppPath(pathname) && !isAuthenticated) {
    return "/login";
  }

  if (pathname === "/login" && isAuthenticated) {
    return "/app";
  }

  return null;
}
