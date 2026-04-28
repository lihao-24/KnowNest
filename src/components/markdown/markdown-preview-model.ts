import { createElement } from "react";
import type { ComponentPropsWithoutRef } from "react";
import type { Components, Options } from "react-markdown";

type PropsWithOptionalNode<T> = T & {
  node?: unknown;
};

type MarkdownPreviewState = {
  content: string;
  emptyText: string;
  isEmpty: boolean;
};

type SafeMarkdownLinkProps = {
  href: string;
  rel?: string;
  target?: "_blank";
};

type MarkdownPreviewOptions = Pick<
  Options,
  "allowedElements" | "components" | "rehypePlugins" | "skipHtml"
> & {
  components: Components;
};

const emptyMarkdownPreviewText = "暂无正文内容";

function withClassName<T extends { className?: string; node?: unknown }>(
  props: T,
  className: string,
) {
  const { className: currentClassName, node, ...restProps } = props;

  void node;

  return {
    ...restProps,
    className: [className, currentClassName].filter(Boolean).join(" "),
  };
}

function isSafeMarkdownHref(href: string) {
  const normalizedHref = href.trim().toLowerCase();

  return (
    normalizedHref.startsWith("/") ||
    normalizedHref.startsWith("#") ||
    normalizedHref.startsWith("http://") ||
    normalizedHref.startsWith("https://") ||
    normalizedHref.startsWith("mailto:")
  );
}

export function buildMarkdownPreviewState(
  content: string,
): MarkdownPreviewState {
  return {
    content,
    emptyText: emptyMarkdownPreviewText,
    isEmpty: content.trim().length === 0,
  };
}

export function buildSafeMarkdownLinkProps(
  href: string | undefined,
): SafeMarkdownLinkProps {
  if (!href || !isSafeMarkdownHref(href)) {
    return {
      href: "#",
    };
  }

  return {
    href,
    rel: "noreferrer noopener",
    target: "_blank",
  };
}

export function buildMarkdownPreviewOptions(): MarkdownPreviewOptions {
  return {
    components: {
      a: ({
        href,
        ...props
      }: PropsWithOptionalNode<ComponentPropsWithoutRef<"a">>) =>
        createElement("a", {
          ...withClassName(
            props,
            "break-words text-teal-700 underline underline-offset-2 hover:text-teal-900",
          ),
          ...buildSafeMarkdownLinkProps(href),
        }),
      blockquote: (
        props: PropsWithOptionalNode<ComponentPropsWithoutRef<"blockquote">>,
      ) =>
        createElement(
          "blockquote",
          withClassName(
            props,
            "border-l-4 border-slate-200 pl-4 text-slate-600",
          ),
        ),
      code: (props: PropsWithOptionalNode<ComponentPropsWithoutRef<"code">>) =>
        createElement(
          "code",
          withClassName(
            props,
            "break-words rounded bg-slate-100 px-1.5 py-0.5 font-mono text-sm text-slate-900",
          ),
        ),
      h1: (props: PropsWithOptionalNode<ComponentPropsWithoutRef<"h1">>) =>
        createElement(
          "h1",
          withClassName(props, "text-2xl font-semibold tracking-normal"),
        ),
      h2: (props: PropsWithOptionalNode<ComponentPropsWithoutRef<"h2">>) =>
        createElement(
          "h2",
          withClassName(props, "text-xl font-semibold tracking-normal"),
        ),
      h3: (props: PropsWithOptionalNode<ComponentPropsWithoutRef<"h3">>) =>
        createElement(
          "h3",
          withClassName(props, "text-lg font-semibold tracking-normal"),
        ),
      li: (props: PropsWithOptionalNode<ComponentPropsWithoutRef<"li">>) =>
        createElement("li", withClassName(props, "pl-1")),
      ol: (props: PropsWithOptionalNode<ComponentPropsWithoutRef<"ol">>) =>
        createElement(
          "ol",
          withClassName(props, "list-decimal space-y-1 pl-5"),
        ),
      p: (props: PropsWithOptionalNode<ComponentPropsWithoutRef<"p">>) =>
        createElement("p", withClassName(props, "leading-7 text-slate-700")),
      pre: (props: PropsWithOptionalNode<ComponentPropsWithoutRef<"pre">>) =>
        createElement(
          "pre",
          withClassName(
            props,
            "max-w-full overflow-x-auto rounded-md bg-slate-950 p-4 text-sm leading-6 text-slate-50",
          ),
        ),
      ul: (props: PropsWithOptionalNode<ComponentPropsWithoutRef<"ul">>) =>
        createElement("ul", withClassName(props, "list-disc space-y-1 pl-5")),
    },
    skipHtml: true,
  };
}
