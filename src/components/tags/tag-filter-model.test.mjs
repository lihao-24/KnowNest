import assert from "node:assert/strict";

import {
  buildTagFilterHref,
  getSelectedTagId,
} from "./tag-filter-model.ts";

assert.equal(getSelectedTagId({ tag: "  tag-1  " }), "tag-1");
assert.equal(getSelectedTagId({ tag: "" }), undefined);
assert.equal(getSelectedTagId({}), undefined);

assert.equal(
  buildTagFilterHref({ currentTagId: undefined, nextTagId: "tag-1" }),
  "/app?tag=tag-1",
);

assert.equal(
  buildTagFilterHref({ currentTagId: "tag-1", nextTagId: "tag-2" }),
  "/app?tag=tag-2",
);

assert.equal(
  buildTagFilterHref({ currentTagId: "tag-1", nextTagId: undefined }),
  "/app",
);
