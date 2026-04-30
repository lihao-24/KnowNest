import assert from "node:assert/strict";

const { default: nextConfig } = await import("../../../next.config.ts");

assert.equal(typeof nextConfig.headers, "function");

const headers = await nextConfig.headers();

assert.deepEqual(headers, [
  {
    source: "/(.*)",
    headers: [
      {
        key: "X-Frame-Options",
        value: "DENY",
      },
      {
        key: "X-Content-Type-Options",
        value: "nosniff",
      },
      {
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin",
      },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
      },
    ],
  },
]);
