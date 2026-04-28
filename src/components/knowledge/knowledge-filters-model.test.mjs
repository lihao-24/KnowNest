import assert from "node:assert/strict";

import {
  buildClearKnowledgeFiltersHref,
  buildKnowledgeFavoriteFilterHref,
  getKnowledgeFavoriteFilter,
} from "./knowledge-filters-model.ts";

assert.equal(getKnowledgeFavoriteFilter({ favorite: "true" }), true);
assert.equal(getKnowledgeFavoriteFilter({ favorite: " true " }), true);
assert.equal(getKnowledgeFavoriteFilter({ favorite: ["true", "false"] }), true);
assert.equal(getKnowledgeFavoriteFilter({ favorite: "false" }), undefined);
assert.equal(getKnowledgeFavoriteFilter({ favorite: "1" }), undefined);
assert.equal(getKnowledgeFavoriteFilter(undefined), undefined);

assert.equal(
  buildKnowledgeFavoriteFilterHref({
    currentSearchParams: {
      q: "  drizzle  ",
      tag: "tag-1",
      space: "life",
      status: "organized",
      type: "link",
    },
    isFavorite: true,
  }),
  "/app?q=drizzle&tag=tag-1&space=life&status=organized&type=link&favorite=true",
);

assert.equal(
  buildKnowledgeFavoriteFilterHref({
    currentSearchParams: {
      q: "drizzle",
      tag: "tag-1",
      space: "life",
      status: "organized",
      type: "link",
      favorite: "true",
    },
    isFavorite: false,
  }),
  "/app?q=drizzle&tag=tag-1&space=life&status=organized&type=link",
);

assert.equal(buildClearKnowledgeFiltersHref(), "/app");
