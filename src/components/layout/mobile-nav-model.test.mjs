import assert from "node:assert/strict";

import {
  getMobileNavButtonLabel,
  getNextMobileNavOpenState,
} from "./mobile-nav-model.ts";

assert.equal(getNextMobileNavOpenState(false, "open"), true);
assert.equal(getNextMobileNavOpenState(true, "open"), true);
assert.equal(getNextMobileNavOpenState(false, "close"), false);
assert.equal(getNextMobileNavOpenState(true, "close"), false);
assert.equal(getNextMobileNavOpenState(false, "toggle"), true);
assert.equal(getNextMobileNavOpenState(true, "toggle"), false);

assert.equal(getMobileNavButtonLabel(false), "打开导航");
assert.equal(getMobileNavButtonLabel(true), "关闭导航");
