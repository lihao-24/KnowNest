import assert from "node:assert/strict";

import {
  buildKnowledgeMetadataFilterHref,
  getKnowledgeMetadataFilters,
} from "./knowledge-metadata-filter-model.ts";

assert.deepEqual(
  getKnowledgeMetadataFilters({
    space: " life ",
    status: " archived ",
    type: " link ",
  }),
  {
    space: "life",
    status: "archived",
    type: "link",
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
  },
);

assert.deepEqual(getKnowledgeMetadataFilters(undefined), {
  space: undefined,
  status: undefined,
  type: undefined,
});

assert.equal(
  buildKnowledgeMetadataFilterHref({
    currentSearchParams: {
      q: "  drizzle  ",
      tag: "tag-1",
      space: "life",
      status: "organized",
      type: "note",
    },
    nextFilters: { space: "work" },
  }),
  "/app?q=drizzle&tag=tag-1&space=work&status=organized&type=note",
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
    nextFilters: { status: undefined },
  }),
  "/app?q=drizzle&tag=tag-1&space=life&type=link",
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
