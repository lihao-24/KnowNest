import assert from "node:assert/strict";

import {
  addTagValue,
  removeTagValue,
} from "./tag-input-model.ts";

assert.deepEqual(addTagValue(["work"], "  life  "), ["work", "life"]);
assert.deepEqual(addTagValue(["work"], "   "), ["work"]);
assert.deepEqual(addTagValue(["work"], "work"), ["work"]);
assert.deepEqual(addTagValue(["work", "life"], "prompt"), [
  "work",
  "life",
  "prompt",
]);

assert.deepEqual(removeTagValue(["work", "life", "prompt"], "life"), [
  "work",
  "prompt",
]);
assert.deepEqual(removeTagValue(["work"], "missing"), ["work"]);
