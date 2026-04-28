import assert from "node:assert/strict";

import {
  getSettingsViewModel,
  SETTINGS_LOGOUT_BUTTON_MIN_HEIGHT_CLASS,
} from "./settings-model.ts";

const settings = getSettingsViewModel({
  id: "user-1",
  email: "user@example.com",
});

assert.equal(settings.accountEmail, "user@example.com");
assert.equal(settings.appVersion, "V0.1");
assert.equal(settings.logoutButtonLabel, "退出登录");
assert.equal(settings.logoutPendingLabel, "退出中...");
assert.equal(settings.logoutButtonMinHeightClass, "h-11");
assert.equal(SETTINGS_LOGOUT_BUTTON_MIN_HEIGHT_CLASS, "h-11");

const settingsWithoutEmail = getSettingsViewModel({
  id: "user-2",
  email: null,
});

assert.equal(settingsWithoutEmail.accountEmail, "邮箱未提供");
