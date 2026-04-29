import assert from "node:assert/strict";

import { getAuthRedirect } from "./route-protection.ts";

assert.equal(getAuthRedirect("/app", false), "/login");
assert.equal(getAuthRedirect("/app/settings", false), "/login");

assert.equal(getAuthRedirect("/app", true), null);
assert.equal(getAuthRedirect("/app/settings", true), null);

assert.equal(getAuthRedirect("/login", true), "/app");
assert.equal(getAuthRedirect("/", true), "/app");

assert.equal(getAuthRedirect("/login", false), null);
assert.equal(getAuthRedirect("/", false), "/login");
assert.equal(getAuthRedirect("/app-settings", false), null);
