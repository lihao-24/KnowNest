import assert from "node:assert/strict";

import {
  buildKnowledgeMetadataFilterHref,
  getKnowledgeSortOrder,
  getKnowledgeMetadataFilters,
} from "./knowledge-metadata-filter-model.ts";

assert.deepEqual(
  getKnowledgeMetadataFilters({
    space: " life ",
    status: " archived ",
    type: " link ",
    category: " category-1 ",
    order: "created_at_desc",
  }),
  {
    space: "life",
    status: "archived",
    type: "link",
    categoryId: "category-1",
  },
);

assert.deepEqual(
  getKnowledgeMetadataFilters({
    space: "invalid",
    status: ["organized", "archived"],
    type: "   ",
  }),
  {
    space: undefined,
    status: "organized",
    type: undefined,
    categoryId: undefined,
  },
);

assert.deepEqual(getKnowledgeMetadataFilters(undefined), {
  space: undefined,
  status: undefined,
  type: undefined,
  categoryId: undefined,
});

assert.equal(getKnowledgeSortOrder({ order: "created_at_asc" }), "created_at_asc");
assert.equal(getKnowledgeSortOrder({ order: "invalid" }), "updated_at_desc");
assert.equal(getKnowledgeSortOrder(undefined), "updated_at_desc");

assert.equal(
  buildKnowledgeMetadataFilterHref({
    currentSearchParams: {
      q: "  drizzle  ",
      tag: "tag-1",
      space: "life",
      status: "organized",
      type: "note",
      category: "category-1",
      favorite: "true",
      order: "created_at_desc",
    },
    nextFilters: { space: "work" },
  }),
  "/app?q=drizzle&tag=tag-1&favorite=true&order=created_at_desc&space=work&status=organized&type=note&category=category-1",
);

assert.equal(
  buildKnowledgeMetadataFilterHref({
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
    nextFilters: { status: undefined, categoryId: undefined },
  }),
  "/app?q=drizzle&tag=tag-1&favorite=true&order=created_at_asc&space=life&type=link",
);

assert.equal(
  buildKnowledgeMetadataFilterHref({
    currentSearchParams: {
      q: "drizzle",
      tag: "tag-1",
      space: "life",
      status: "archived",
      type: "link",
    },
    nextFilters: { space: undefined, status: undefined, type: undefined },
  }),
  "/app?q=drizzle&tag=tag-1",
);
