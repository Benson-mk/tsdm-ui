<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import type { Node as PMNode } from "prosemirror-model";
import type { Preferences } from "../workspace/preferences";
import { importSource } from "../editor/model";
import { editorNode, editorMark } from "./editor-dom";
import { editorText } from "./editor-strings";
const props = defineProps<{
  source: string;
  language: Preferences["language"];
}>();
const mount = ref<HTMLElement | null>(null);
// The editor's inert interpretation and bounded DOM adapter are reused without
// creating an EditorView, mutable editor session, commands or external URLs.
function render(node: PMNode): Node {
  const view = node.isText
    ? null
    : editorNode(node, {
        hide: editorText("Reply-to-view hidden block", props.language),
        spoiler: editorText("Spoiler", props.language),
      });
  let dom = view?.dom ?? document.createTextNode(node.text ?? "");
  if (view?.contentDOM)
    node.forEach((child) => view.contentDOM!.appendChild(render(child)));
  for (const mark of [...node.marks].reverse()) {
    const wrapper = editorMark(mark);
    (wrapper.contentDOM ?? wrapper.dom).appendChild(dom);
    dom = wrapper.dom;
  }
  if (node.type.name === "table" || node.type.name === "code_block") {
    const region = document.createElement("div");
    region.className = "prepared-overflow";
    region.tabIndex = 0;
    region.setAttribute("role", "region");
    region.setAttribute(
      "aria-label",
      editorText(
        node.type.name === "table" ? "Scrollable table" : "Scrollable code",
        props.language,
      ),
    );
    region.appendChild(dom);
    return region;
  }
  return dom;
}
function update() {
  const root = mount.value;
  if (!root) return;
  const fragment = document.createDocumentFragment();
  importSource(props.source).doc.forEach((node) =>
    fragment.appendChild(render(node)),
  );
  root.replaceChildren(fragment);
}
onMounted(update);
watch(() => [props.source, props.language], update);
</script>
<template><div ref="mount" class="prepared-body post-content" /></template>
