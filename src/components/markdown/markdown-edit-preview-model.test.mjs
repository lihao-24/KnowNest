import assert from "node:assert/strict";

import {
  buildMarkdownEditPreviewState,
  getInitialMarkdownEditPreviewMode,
  getNextMarkdownEditPreviewMode,
} from "./markdown-edit-preview-model.ts";

assert.equal(getInitialMarkdownEditPreviewMode(), "edit");

assert.equal(getNextMarkdownEditPreviewMode("edit", "preview"), "preview");
assert.equal(getNextMarkdownEditPreviewMode("preview", "edit"), "edit");
assert.equal(getNextMarkdownEditPreviewMode("preview", "unknown"), "preview");

const editState = buildMarkdownEditPreviewState({
  content: "Current **content**",
  mode: "edit",
  name: "content",
});

assert.equal(editState.mode, "edit");
assert.equal(editState.isEditing, true);
assert.equal(editState.isPreviewing, false);
assert.equal(editState.previewContent, "Current **content**");
assert.equal(editState.contentField.name, "content");
assert.equal(editState.contentField.value, "Current **content**");
assert.equal(editState.contentField.type, "textarea");

const previewState = buildMarkdownEditPreviewState({
  content: "Updated # content",
  mode: "preview",
  name: "content",
});

assert.equal(previewState.mode, "preview");
assert.equal(previewState.isEditing, false);
assert.equal(previewState.isPreviewing, true);
assert.equal(previewState.previewContent, "Updated # content");
assert.equal(previewState.contentField.name, "content");
assert.equal(previewState.contentField.value, "Updated # content");
assert.equal(previewState.contentField.type, "hidden");
