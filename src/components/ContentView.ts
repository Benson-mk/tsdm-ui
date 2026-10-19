import { defineComponent, h, type PropType, type VNode } from "vue";
import type { ContentNode } from "../forum-client";
import { description } from "../layouts/strings";
import type { Preferences } from "../workspace/preferences";
function render(
  node: ContentNode,
  language: Preferences["language"],
): VNode | string {
  const children = () =>
    node.kind === "text"
      ? []
      : node.children.map((child) => render(child, language));
  if (node.kind === "text") return node.text;
  if (node.kind === "unsupported")
    return h("div", [
      h(
        "p",
        { class: "content-notice" },
        description(node.description, language),
      ),
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
  },
  setup: (props) => () =>
    h(
      "div",
      { class: "post-content" },
      props.nodes.map((node) => render(node, props.language)),
    ),
});
