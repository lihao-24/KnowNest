import assert from "node:assert/strict";

import {
  isSidebarNavItemActive,
  primaryNavItems,
  settingsNavItem,
  spaceNavItems,
} from "./app-sidebar-nav.ts";

const emptySearchParams = new URLSearchParams();

assert.equal(
  isSidebarNavItemActive(
    primaryNavItems[0],
    "/app/items/new",
    emptySearchParams,
  ),
  true,
);
assert.equal(
  isSidebarNavItemActive(primaryNavItems[1], "/app", emptySearchParams),
  true,
);
assert.equal(
  isSidebarNavItemActive(
    primaryNavItems[1],
    "/app",
    new URLSearchParams("space=life"),
  ),
  false,
);
assert.equal(
  isSidebarNavItemActive(spaceNavItems[0], "/app", new URLSearchParams("space=life")),
  true,
);
assert.equal(
  isSidebarNavItemActive(spaceNavItems[0], "/app", new URLSearchParams("space=work")),
  false,
);
assert.equal(
  isSidebarNavItemActive(spaceNavItems[1], "/app", new URLSearchParams("space=work")),
  true,
);
assert.equal(
  isSidebarNavItemActive(settingsNavItem, "/app/settings", emptySearchParams),
  true,
);
