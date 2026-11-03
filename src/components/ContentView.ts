import { defineComponent, h, type PropType, type VNode } from "vue";
import { describeDestination, type ContentNode } from "../forum-client";
import { description, strings, insert } from "../layouts/strings";
import { nativeDestination } from "../hosts/browser";
import type { Preferences } from "../workspace/preferences";
function render(
  node: ContentNode,
  language: Preferences["language"],
  nativeLinks = false,
  summarized?: ReadonlyMap<string, number>,
): VNode | string {
  const children = () =>
    node.kind === "text"
      ? []
      : node.children.map((child) =>
          render(child, language, nativeLinks, summarized),
        );
  if (node.kind === "text") return node.text;
  if (node.kind === "unsupported")
    return h("div", [
      ...(summarized?.has(node.description)
        ? []
        : [
            h(
              "p",
              { class: "content-notice" },
              description(node.description, language),
            ),
          ]),
      ...children(),
    ]);
  if (node.tag === "table")
    return h(
      "div",
      {
        class: "table-overflow",
        role: "region",
        "aria-label": description("Scrollable table", language),
        tabindex: "0",
      },
      [h(node.tag, node.attributes, children())],
    );
  if (
    nativeLinks &&
    node.tag === "a" &&
    node.attributes.href &&
    new URL(node.attributes.href).origin === location.origin &&
    !["thread", "redirect"].includes(
      describeDestination(node.attributes.href)?.kind ?? "",
    )
  )
    return h(
      "a",
      { ...node.attributes, href: nativeDestination(node.attributes.href) },
      [...children(), ` — ${strings(language).native}`],
    );
  const attributes =
    node.tag === "pre" || node.attributes.class === "code-block"
      ? {
          ...node.attributes,
          role: "region",
          "aria-label": description("Scrollable code", language),
          tabindex: "0",
        }
      : node.attributes;
  return h(node.tag, attributes, children());
}
export default defineComponent({
  name: "ContentView",
  props: {
    language: {
      type: String as PropType<Preferences["language"]>,
      default: "en",
    },
    nodes: { type: Array as PropType<readonly ContentNode[]>, required: true },
    nativeLinks: { type: Boolean, default: false },
    summarizeFormatting: { type: Boolean, default: false },
  },
  setup: (props) => () => {
    const formatting = new Map<string, number>();
    const collect = (nodes: readonly ContentNode[]) => {
      for (const node of nodes) {
        if (node.kind === "text") continue;
        if (
          node.kind === "unsupported" &&
          /^Unsupported formatting \(.+\)$/.test(node.description)
        )
          formatting.set(
            node.description,
            (formatting.get(node.description) ?? 0) + 1,
          );
        collect(node.children);
      }
    };
    if (props.summarizeFormatting) collect(props.nodes);
    const summarized = [...formatting.values()].some((count) => count > 1)
      ? formatting
      : undefined;
    return h("div", { class: "post-content" }, [
      ...props.nodes.map((node) =>
        render(node, props.language, props.nativeLinks, summarized),
      ),
      ...(summarized
        ? [
            h("details", { class: "format-notices" }, [
              h(
                "summary",
                insert(
                  strings(props.language).formatSummary,
                  [...summarized.values()].reduce(
                    (sum, count) => sum + count,
                    0,
                  ),
                ),
              ),
              h(
                "ul",
                [...summarized].map(([value, count]) =>
                  h("li", `${description(value, props.language)} × ${count}`),
                ),
              ),
            ]),
          ]
        : []),
    ]);
  },
});
