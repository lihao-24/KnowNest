export type MarkdownEditPreviewMode = "edit" | "preview";

type BuildMarkdownEditPreviewStateOptions = {
  content: string;
  mode: MarkdownEditPreviewMode;
  name?: string;
};

const markdownEditPreviewModes = new Set<MarkdownEditPreviewMode>([
  "edit",
  "preview",
]);

export function getInitialMarkdownEditPreviewMode(): MarkdownEditPreviewMode {
  return "edit";
}

export function getNextMarkdownEditPreviewMode(
  currentMode: MarkdownEditPreviewMode,
  nextMode: string,
): MarkdownEditPreviewMode {
  if (markdownEditPreviewModes.has(nextMode as MarkdownEditPreviewMode)) {
    return nextMode as MarkdownEditPreviewMode;
  }

  return currentMode;
}

export function buildMarkdownEditPreviewState({
  content,
  mode,
  name,
}: BuildMarkdownEditPreviewStateOptions) {
  const isEditing = mode === "edit";

  return {
    contentField: {
      name,
      type: isEditing ? "textarea" : "hidden",
      value: content,
    },
    isEditing,
    isPreviewing: !isEditing,
    mode,
    previewContent: content,
  };
}
