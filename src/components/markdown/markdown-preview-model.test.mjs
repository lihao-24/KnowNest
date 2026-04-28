import assert from "node:assert/strict";

import {
  buildMarkdownPreviewOptions,
  buildMarkdownPreviewState,
  buildSafeMarkdownLinkProps,
} from "./markdown-preview-model.ts";

const emptyState = buildMarkdownPreviewState("");

assert.equal(emptyState.isEmpty, true);
assert.equal(emptyState.content, "");
assert.equal(emptyState.emptyText, "暂无正文内容");

const filledState = buildMarkdownPreviewState("  # Title  ");

assert.equal(filledState.isEmpty, false);
assert.equal(filledState.content, "  # Title  ");

const options = buildMarkdownPreviewOptions();

assert.equal(options.skipHtml, true);
assert.equal(options.allowedElements, undefined);
assert.equal(options.rehypePlugins, undefined);
assert.equal(typeof options.components.h1, "function");
assert.equal(typeof options.components.ul, "function");
assert.equal(typeof options.components.ol, "function");
assert.equal(typeof options.components.blockquote, "function");
assert.equal(typeof options.components.a, "function");
assert.equal(typeof options.components.code, "function");
assert.equal(typeof options.components.pre, "function");

assert.deepEqual(
  buildSafeMarkdownLinkProps("https://example.com/docs"),
  {
    href: "https://example.com/docs",
    rel: "noreferrer noopener",
    target: "_blank",
  },
);

assert.deepEqual(buildSafeMarkdownLinkProps("javascript:alert(1)"), {
  href: "#",
});
