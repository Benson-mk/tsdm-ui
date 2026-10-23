<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch,
} from "vue";
import { DOMSerializer, type DOMOutputSpec } from "prosemirror-model";
import { EditorView } from "prosemirror-view";
import { baseKeymap } from "prosemirror-commands";
import { keydownHandler } from "prosemirror-keymap";
import type { Workspace } from "../workspace";
import { clipboardText } from "../editor/model.js";
import { editorNode, editorMark } from "./editor-dom";
import type { EditorSnapshot } from "../editor/session.js";
import { editorText } from "./editor-strings";
import { strings } from "../layouts/strings";
const props = defineProps<{ workspace: Workspace }>();
const writing = props.workspace.writing;
const session = writing.editor();
const state = shallowRef<EditorSnapshot>(session.state);
const text = computed(() =>
  strings(props.workspace.preferences.state.value.language),
);
const source = ref<HTMLTextAreaElement | null>(null);
const mount = ref<HTMLDivElement | null>(null);
let view: EditorView | null = null;
let unsubscribe = () => {};
const t = (value: string) =>
  editorText(value, props.workspace.preferences.state.value.language);
const inputMessage = ref("");
const argument = ref("");
const tool = ref("b");
const tools = [
  ["b", "Bold"],
  ["i", "Italic"],
  ["u", "Underline"],
  ["s", "Strike"],
  ["font", "Font"],
  ["size", "Size"],
  ["color", "Color"],
  ["sub", "Subscript"],
  ["sup", "Superscript"],
  ["align", "Alignment"],
  ["ul", "Unordered list"],
  ["ol", "Ordered list"],
  ["indent", "Indent"],
  ["listIndent", "Indent list"],
  ["outdent", "Outdent list"],
  ["url", "Link URL"],
  ["email", "Email"],
  ["img", "Image URL"],
  ["emoticon", "Emoticon code"],
  ["quote", "Named quote"],
  ["code", "Code"],
];
function focus() {
  void nextTick(() => {
    if (state.value.mode === "visual") view?.focus();
    else {
      source.value?.focus();
      const range = session.sourceSelection;
      source.value?.setSelectionRange(range.from, range.to, range.direction);
    }
  });
}
function mode(value: "source" | "visual") {
  if (writing.deferViewChange(() => mode(value))) return;
  session.setMode(value);
  focus();
}
function selected() {
  const el = source.value;
  if (el) {
    session.setSourceSelection(
      el.selectionStart,
      el.selectionEnd,
      el.selectionDirection,
    );
    writing.edit({
      selection: {
        start: el.selectionStart,
        end: el.selectionEnd,
        direction: el.selectionDirection,
      },
    });
  }
}
function input(event: Event) {
  const el = event.target as HTMLTextAreaElement;
  session.updateSource({
    value: el.value,
    selection: {
      from: el.selectionStart,
      to: el.selectionEnd,
      direction: el.selectionDirection,
    },
  });
}
function travel(direction: "undo" | "redo") {
  session[direction]();
  focus();
}
function apply() {
  if (state.value.composing) return;
  if (state.value.mode !== "visual") session.setMode("visual");
  const name = tool.value,
    value = argument.value;
  if (["ul", "ol"].includes(name))
    session.command("list", { ordered: name === "ol" });
  else if (name === "listIndent" || name === "outdent")
    session.command(name === "listIndent" ? "listIndent" : "listOutdent");
  else if (name === "indent") session.command("section", { kind: "indent" });
  else if (name === "quote") session.command("quote", { author: value });
  else if (name === "code") session.command("code");
  else if (name === "align")
    session.command("section", { kind: "align", value });
  else if (name === "img")
    session.command("reference", { kind: "img", body: value });
  else if (name === "emoticon") session.command("emoticon", { code: value });
  else
    session.command("format", {
      tag: name,
      ...(["font", "size", "color", "url", "email"].includes(name)
        ? { value }
        : {}),
    });
  focus();
}
function composition(value: boolean) {
  if (value) {
    session.setComposing(true);
    writing.startComposition();
  } else
    setTimeout(() => {
      session.setComposing(false);
      writing.endComposition();
    }, 30);
}
function interpret() {
  writing.interpretEditorSource();
}
onMounted(() => {
  if (!mount.value) return;
  const nodes = Object.fromEntries(
    Object.keys(session.pmState.schema.nodes)
      .filter((name) => name !== "text" && name !== "doc")
      .map((name) => [name, editorNode]),
  );
  view = new EditorView(mount.value, {
    state: session.pmState,
    attributes: {
      role: "textbox",
      "aria-label": t("Visual post content"),
      "aria-multiline": "true",
    },
    nodeViews: nodes,
    markViews: { format: editorMark, literal: editorMark },
    dispatchTransaction: (transaction) => {
      session.dispatch(transaction);
    },
    handleKeyDown: (editor, event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        travel(event.shiftKey ? "redo" : "undo");
        return true;
      }
      return keydownHandler(baseKeymap)(editor, event);
    },
    handlePaste: (_view, event) => {
      event.preventDefault();
      if (!event.clipboardData?.types.includes("text/plain")) {
        inputMessage.value =
          "Paste plain text or insert an image URL. Your selection is retained.";
        return true;
      }
      inputMessage.value = "";
      session.command("paste", {
        text: event.clipboardData.getData("text/plain"),
      });
      return true;
    },
    clipboardTextSerializer: clipboardText,
    clipboardSerializer: new DOMSerializer(
      Object.fromEntries(
        Object.keys(session.pmState.schema.nodes)
          .filter((name) => name !== "doc" && name !== "text")
          .map((name) => [name, (node) => editorNode(node) as DOMOutputSpec]),
      ),
      {
        format: (mark) => editorMark(mark) as DOMOutputSpec,
        literal: (mark) => editorMark(mark) as DOMOutputSpec,
      },
    ),
    handleDOMEvents: {
      compositionstart: (_view, event) => {
        event.stopPropagation();
        composition(true);
        return false;
      },
      compositionend: (_view, event) => {
        event.stopPropagation();
        composition(false);
        return false;
      },
    },
  });
  unsubscribe = session.subscribe((snapshot) => {
    state.value = snapshot;
    if (view && view.state !== session.pmState)
      view.updateState(session.pmState);
  });
  focus();
});
watch(
  () => props.workspace.preferences.state.value.language,
  () =>
    view?.setProps({
      attributes: {
        role: "textbox",
        "aria-label": t("Visual post content"),
        "aria-multiline": "true",
      },
    }),
);
watch(
  () => writing.state.value.context?.source,
  (value) => {
    if (value !== undefined && value !== session.state.source)
      session.replaceSource(value);
  },
);
onBeforeUnmount(() => {
  unsubscribe();
  view?.destroy();
  view = null;
});
// The session belongs to workspace writing; disposing this view never disposes it.
</script>
<template>
  <div class="post-editor">
    <div class="writing-actions">
      <button :aria-pressed="state.mode === 'visual'" @click="mode('visual')">
        {{ t("Visual editor") }}
      </button>
      <button :aria-pressed="state.mode === 'source'" @click="mode('source')">
        {{ t("Source editor") }}
      </button>
      <button
        :disabled="!state.canUndo || state.composing"
        @click="travel('undo')"
      >
        {{ t("Undo") }}
      </button>
      <button
        :disabled="!state.canRedo || state.composing"
        @click="travel('redo')"
      >
        {{ t("Redo") }}
      </button>
    </div>
    <div class="editor-tools">
      <label
        >{{ t("Formatting")
        }}<select v-model="tool" :aria-label="t('Formatting')">
          <option v-for="item in tools" :key="item[0]" :value="item[0]">
            {{ t(item[1] ?? "") }}
          </option>
        </select></label
      >
      <label>{{ t("Format value") }}<input v-model="argument" /></label>
      <button :disabled="state.composing" @mousedown.prevent @click="apply">
        {{ t("Apply formatting") }}
      </button>
    </div>
    <p
      v-if="state.issues.some((issue) => issue.kind === 'protected')"
      role="status"
    >
      {{
        t(
          "Some markup is protected in visual mode. Edit its complete source to change it.",
        )
      }}
    </p>
    <p v-if="inputMessage" role="status">{{ t(inputMessage) }}</p>
    <p v-if="state.message" role="alert">{{ t(state.message) }}</p>
    <p
      v-if="state.issues.some((issue) => issue.kind === 'conversion-error')"
      role="alert"
    >
      {{
        t(
          "Visual conversion could not preserve this content. The complete source remains editable.",
        )
      }}
    </p>
    <p v-if="writing.state.value.context?.editorUnresolved" role="alert">
      {{
        t(
          "Some visual input has no unambiguous BBCode representation. Complete source is retained. Review it before choosing how it should be interpreted.",
        )
      }}
      <button @click="interpret">
        {{ t("Interpret complete source as BBCode") }}
      </button>
    </p>
    <div v-show="state.mode === 'visual'" ref="mount" class="visual-editor" />
    <label v-show="state.mode === 'source'"
      >{{ text.completeSource
      }}<textarea
        ref="source"
        :value="state.display"
        rows="14"
        spellcheck="false"
        @input="input"
        @select="selected"
        @keyup="selected"
        @click="selected"
        @blur="selected"
        @compositionstart.stop="composition(true)"
        @compositionend.stop="composition(false)"
        @keydown.meta.z.prevent="travel($event.shiftKey ? 'redo' : 'undo')"
        @keydown.ctrl.z.prevent="travel($event.shiftKey ? 'redo' : 'undo')"
      />
    </label>
  </div>
</template>
