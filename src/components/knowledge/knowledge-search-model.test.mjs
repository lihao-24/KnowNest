import assert from "node:assert/strict";

import {
  buildKnowledgeSearchClearHref,
  getSearchKeyword,
} from "./knowledge-search-model.ts";

assert.equal(getSearchKeyword({ q: "  drizzle  " }), "drizzle");
assert.equal(getSearchKeyword({ q: ["  first  ", "second"] }), "first");
assert.equal(getSearchKeyword({ q: "   " }), undefined);
assert.equal(getSearchKeyword({}), undefined);
assert.equal(getSearchKeyword(undefined), undefined);

assert.equal(
  buildKnowledgeSearchClearHref({
    currentSearchParams: {
      q: "drizzle",
      tag: "tag-1",
      space: "life",
      status: "archived",
      type: "link",
      category: "category-1",
      favorite: "true",
      order: "created_at_asc",
    },
  }),
  "/app?tag=tag-1&space=life&status=archived&type=link&category=category-1&favorite=true&order=created_at_asc",
);

assert.equal(
  buildKnowledgeSearchClearHref({
    currentSearchParams: { q: "drizzle" },
  }),
  "/app",
);
