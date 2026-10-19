import { defineComponent, h, type PropType, type VNode } from "vue";
import type { ContentNode } from "../forum-client";
function render(node: ContentNode): VNode | string {
  if (node.kind === "text") return node.text;
  if (node.kind === "unsupported")
    return h("div", [
      h("p", { class: "content-notice" }, node.description),
      ...node.children.map(render),
    ]);
  if (node.tag === "table")
    return h(
      "div",
      {
        class: "table-overflow",
        role: "region",
        "aria-label": "Scrollable table",
        tabindex: "0",
      },
      [h(node.tag, node.attributes, node.children.map(render))],
    );
  const attributes =
    node.tag === "pre" || node.attributes.class === "code-block"
      ? {
          ...node.attributes,
          role: "region",
          "aria-label": "Scrollable code",
          tabindex: "0",
        }
      : node.attributes;
  return h(node.tag, attributes, node.children.map(render));
}
export default defineComponent({
  name: "ContentView",
  props: {
    nodes: { type: Array as PropType<readonly ContentNode[]>, required: true },
  },
  setup: (props) => () =>
    h("div", { class: "post-content" }, props.nodes.map(render)),
});
