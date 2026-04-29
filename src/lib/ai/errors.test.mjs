import assert from "node:assert/strict";

import { AIRequestError, toAIErrorResponse } from "./errors.ts";

const requestError = new AIRequestError(
  "content_too_short",
  400,
  "内容过短，无法生成。",
);

assert.equal(requestError.name, "AIRequestError");
assert.equal(requestError.code, "content_too_short");
assert.equal(requestError.status, 400);
assert.equal(requestError.message, "内容过短，无法生成。");

assert.deepEqual(toAIErrorResponse(requestError), {
  status: 400,
  body: {
    ok: false,
    error: {
      code: "content_too_short",
      message: "内容过短，无法生成。",
    },
  },
});

assert.deepEqual(toAIErrorResponse(new Error("raw provider error")), {
  status: 500,
  body: {
    ok: false,
    error: {
      code: "provider_failed",
      message: "AI 请求失败，请稍后重试。",
    },
  },
});
