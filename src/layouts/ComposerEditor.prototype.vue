<script setup lang="ts">
// Use the real source-preserving editor with a throwaway, forum-free owner.
import {
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch,
} from "vue";
import type { Node as PMNode } from "prosemirror-model";
import { EditorView } from "prosemirror-view";
import { baseKeymap } from "prosemirror-commands";
import { keydownHandler } from "prosemirror-keymap";
import { createEditorSession } from "../editor/session";
import { editorNode, editorMark } from "../components/editor-dom";
const props = withDefaults(
  defineProps<{
    modelValue: string;
    sourceMode?: boolean;
    readOnly?: boolean;
    descriptionId?: string;
  }>(),
  { sourceMode: false, readOnly: false, descriptionId: "" },
);
const emit = defineEmits<{
  "update:modelValue": [value: string];
  send: [];
  ready: [value: boolean];
  composing: [value: boolean];
}>();
const mount = ref<HTMLDivElement>();
const source = ref<HTMLTextAreaElement>();
const session = createEditorSession({ source: props.modelValue });
const snapshot = shallowRef(session.state);
let view: EditorView | undefined;
let importing = false;
let compositionTimer: ReturnType<typeof setTimeout>;
function compose(value: boolean) {
  clearTimeout(compositionTimer);
  if (value) {
    session.setComposing(true);
    emit("composing", true);
  } else
    compositionTimer = setTimeout(() => {
      session.setComposing(false);
      emit("composing", false);
    }, 40);
}
function keyboard(event: KeyboardEvent) {
  if (event.isComposing || event.keyCode === 229 || session.state.composing)
    return false;
  if (
    event.key === "Enter" &&
    event.shiftKey &&
    session.state.mode === "visual"
  ) {
    event.preventDefault();
    session.command("paste", { text: "\n" });
    return true;
  }
  if (
    event.key === "Enter" &&
    !event.shiftKey &&
    (session.state.mode === "visual" || event.metaKey || event.ctrlKey)
  ) {
    event.preventDefault();
    if (!event.repeat) emit("send");
    return true;
  }
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
    event.preventDefault();
    session[event.shiftKey ? "redo" : "undo"]();
    return true;
  }
  return false;
}
function resize() {
  if (source.value) {
    source.value.style.height = "0";
    source.value.style.height = source.value.scrollHeight + "px";
  }
}
const unsubscribe = session.subscribe((value) => {
  snapshot.value = value;
  if (view && view.state !== session.pmState) view.updateState(session.pmState);
  if (!importing && value.source !== props.modelValue)
    emit("update:modelValue", value.source);
  emit("ready", value.readiness.ready);
  void nextTick(resize);
});
async function focus() {
  await nextTick();
  if (session.state.mode === "visual") view?.focus();
  else {
    source.value?.focus();
    const range = session.sourceSelection;
    source.value?.setSelectionRange(range.from, range.to, range.direction);
  }
}
function input(event: Event) {
  const field = event.target as HTMLTextAreaElement;
  session.updateSource({
    value: field.value,
    selection: {
      from: field.selectionStart,
      to: field.selectionEnd,
      direction: field.selectionDirection,
    },
  });
}
function selection() {
  if (source.value)
    session.setSourceSelection(
      source.value.selectionStart,
      source.value.selectionEnd,
      source.value.selectionDirection,
    );
}
function format(tag: string, value = "") {
  if (session.state.composing) return;
  session.setMode("visual");
  if (tag === "quote") session.command("quote");
  else session.command("format", { tag, value });
  void focus();
}
function insert(text: string) {
  if (session.state.mode === "source") {
    const { from, to } = session.sourceSelection;
    const value = session.state.display;
    session.updateSource({
      value: value.slice(0, from) + text + value.slice(to),
      selection: {
        from: from + text.length,
        to: from + text.length,
        direction: "none",
      },
    });
  } else session.command("paste", { text });
  void focus();
}
onMounted(() => {
  view = new EditorView(mount.value!, {
    state: session.pmState,
    editable: () => !props.readOnly,
    attributes: {
      role: props.readOnly ? "document" : "textbox",
      "aria-label": props.readOnly ? "Formatted reply" : "Reply text",
      "aria-multiline": "true",
      "data-placeholder": "Write a reply…",
      ...(props.descriptionId
        ? { "aria-describedby": props.descriptionId }
        : {}),
    },
    nodeViews: Object.fromEntries(
      Object.keys(session.pmState.schema.nodes)
        .filter((n) => n !== "text" && n !== "doc")
        .map((n) => [n, (node: PMNode) => editorNode(node)]),
    ),
    markViews: { format: editorMark, literal: editorMark },
    dispatchTransaction: (transaction) => session.dispatch(transaction),
    handleKeyDown: (editor, event) =>
      keyboard(event) || keydownHandler(baseKeymap)(editor, event),
    handlePaste: (_view, event) => {
      event.preventDefault();
      session.command("paste", {
        text: event.clipboardData?.getData("text/plain") ?? "",
      });
      return true;
    },
    handleDOMEvents: {
      compositionstart: () => {
        compose(true);
        return false;
      },
      compositionend: () => {
        compose(false);
        return false;
      },
    },
  });
  session.setMode(props.sourceMode ? "source" : "visual");
  emit("ready", session.state.readiness.ready);
});
watch(
  () => props.modelValue,
  (value) => {
    if (value === session.state.source) return;
    importing = true;
    session.replaceSource(value);
    importing = false;
  },
);
watch(
  () => props.sourceMode,
  (value) => {
    session.setMode(value ? "source" : "visual");
    void focus();
  },
);
onBeforeUnmount(() => {
  clearTimeout(compositionTimer);
  unsubscribe();
  view?.destroy();
  session.dispose();
});
defineExpose({ focus, format, insert });
</script>
<template>
  <div class="cf-editor" :class="{ 'cf-readonly': readOnly }">
    <div v-show="snapshot.mode === 'visual'" ref="mount" class="cf-visual" />
    <textarea
      v-if="snapshot.mode === 'source'"
      ref="source"
      :value="snapshot.display"
      :readonly="readOnly"
      aria-label="BBCode reply"
      :aria-describedby="descriptionId || undefined"
      rows="1"
      @input="input"
      @select="selection"
      @keyup="selection"
      @click="selection"
      @keydown="keyboard"
      @compositionstart="compose(true)"
      @compositionend="compose(false)"
    />
    <p v-if="!snapshot.readiness.ready && !readOnly" class="cf-warning">
      Complete source is retained. Resolve unsupported content in BBCode before
      sending.
    </p>
  </div>
</template>
