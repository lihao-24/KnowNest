import { describe, expect, it } from "vitest";
import { resolveAuthenticatedUser, sanitizeRedirectPath } from "./server";

describe("auth helpers", () => {
  it("sanitizes redirect paths to same-site destinations", () => {
    expect(sanitizeRedirectPath("/workspace")).toBe("/workspace");
    expect(sanitizeRedirectPath("/workspace?tab=chat")).toBe("/workspace?tab=chat");
    expect(sanitizeRedirectPath("https://example.com")).toBe("/workspace");
    expect(sanitizeRedirectPath("//example.com/workspace")).toBe("/workspace");
    expect(sanitizeRedirectPath(null)).toBe("/workspace");
  });

  it("does not fall back to demo user when Supabase is configured", () => {
    expect(
      resolveAuthenticatedUser({
        supabaseConfigured: true,
        demoEnabled: true,
        supabaseUser: null
      })
    ).toBeNull();
  });
});
