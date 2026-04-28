import assert from "node:assert/strict";

import { buildMarkdownEditorTextareaProps } from "./markdown-editor-model.ts";

let nextValue = "";
const props = buildMarkdownEditorTextareaProps({
  disabled: true,
  id: "content",
  name: "content",
  onChange: (value) => {
    nextValue = value;
  },
  value: "Existing note",
});

assert.equal(props.disabled, true);
assert.equal(props.id, "content");
assert.equal(props.name, "content");
assert.equal(props.placeholder, "记录正文内容");
assert.equal(props.value, "Existing note");
assert.ok(props.className.includes("min-h-72"));
assert.ok(props.className.includes("sm:min-h-96"));
assert.ok(props.className.includes("resize-y"));

props.onChange({ target: { value: "Updated note" } });

assert.equal(nextValue, "Updated note");
