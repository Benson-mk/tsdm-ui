<script setup lang="ts">
// Single throwaway approval unit. All sends, uploads and account changes are local simulations.
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import ComposerEditor from "./ComposerEditor.prototype.vue";
import {
  copy,
  emptyDraft,
  heads,
  prefix,
  records,
  retain,
  revise,
  type Attachment,
  type Attempt,
  type Draft,
  type Revision,
  type Target,
} from "./composer-store.prototype";
const props = defineProps<{
  thread: { id: string; title: string };
  scroller: HTMLElement | null;
}>();
const emit = defineEmits<{ drafts: [ids: string[]] }>();
const editor = ref<InstanceType<typeof ComposerEditor>>();
const draft = ref<Draft>(emptyDraft());
const nodes = ref<Revision[]>([]),
  attempts = ref<Attempt[]>([]);
const base = ref<string[]>([]);
const editing = ref<string | null>(null);
const context = computed(() =>
  editing.value ? "edit-" + editing.value : props.thread.id,
);
const expanded = ref(false),
  sourceMode = ref(false),
  toolsOpen = ref(false),
  ready = ref(true),
  composing = ref(false);
const account = ref("Sample account A");
const refuseStorage = ref(false),
  pauseUpdates = ref(false);
const storageError = ref("");
const nextOutcome = ref("sent"),
  checkOutcome = ref("sent");
const sheet = ref<HTMLDialogElement>();
const sheetKind = ref("preview");
const sheetTitles: Record<string, string> = {
  preview: "Reply preview",
  format: "Formatting",
  emoji: "Emoji",
  attachments: "Add an attachment",
  conflicts: "Choose a draft",
  alternatives: "Saved alternatives",
  scenarios: "Composer preview controls",
};
const owner = sessionStorage.getItem(prefix + "owner") ?? crypto.randomUUID();
sessionStorage.setItem(prefix + "owner", owner);
const link = ref("https://example.com");
const savedVersions = ref<Revision[]>([]);
const conflicts = computed(() => heads(nodes.value, context.value));
const threadAttempts = computed(() =>
  attempts.value
    .filter((a) => a.thread === props.thread.id && a.status !== "superseded")
    .sort((a, b) => a.time - b.time),
);
const pending = computed(() =>
  threadAttempts.value.some(
    (a) => a.status === "sending" || a.status === "unknown",
  ),
);
const unavailable = computed(() =>
  draft.value.attachments.some(
    (a) => !a.available || a.owner !== account.value,
  ),
);
const sendDisabled = computed(
  () =>
    !draft.value.source.trim() ||
    !ready.value ||
    composing.value ||
    pending.value ||
    unavailable.value ||
    conflicts.value.length > 1 ||
    !!storageError.value,
);
const timers = new Set<ReturnType<typeof setTimeout>>();
const status = ref("");
function reportDrafts() {
  const ids = [...new Set(nodes.value.map((n) => n.thread))].filter(
    (id) =>
      !id.startsWith("edit-") &&
      heads(nodes.value, id).some(
        (n) =>
          n.draft.source.trim() || n.draft.attachments.length || n.draft.target,
      ),
  );
  emit("drafts", ids);
}
function readStore(adopt = false, force = false) {
  try {
    nodes.value = records<Revision>("revision");
    attempts.value = records<Attempt>("attempt");
    savedVersions.value = records<Revision>("kept");
    if (
      adopt &&
      (!pauseUpdates.value || force) &&
      !composing.value &&
      !storageError.value
    ) {
      const tips = heads(nodes.value, context.value);
      if (tips.length <= 1) {
        draft.value = copy(tips[0]?.draft ?? emptyDraft());
        base.value = tips.map((n) => n.id);
      }
    }
    reportDrafts();
  } catch {
    storageError.value =
      "This browser could not read saved writing. Keep this tab open; your current text is still here.";
  }
}
function save(value = draft.value, parents = base.value) {
  try {
    const node = revise(context.value, value, parents, refuseStorage.value);
    base.value = [node.id];
    storageError.value = "";
    readStore();
    return true;
  } catch {
    storageError.value =
      "Draft could not be saved. Keep this tab open and try saving again.";
    return false;
  }
}
function update(source: string) {
  status.value = "";
  draft.value.source = source;
  save();
}
async function focus() {
  await nextTick();
  await editor.value?.focus();
}
function address(post: Target) {
  if (composing.value) return;
  draft.value.target = copy(post);
  save();
  focus();
}
function removeTarget() {
  draft.value.target = null;
  save();
  focus();
}
function quoteTarget() {
  const target = draft.value.target;
  if (!target || composing.value) return;
  update(
    draft.value.source +
      (draft.value.source ? "\n" : "") +
      `[quote]${target.author}: ${target.text}[/quote]\n`,
  );
  focus();
}
async function show(kind: string) {
  toolsOpen.value = false;
  sheetKind.value = kind;
  await nextTick();
  sheet.value?.showModal();
}
function closeSheet() {
  sheet.value?.close();
  focus();
}
function tool(action: string) {
  toolsOpen.value = false;
  if (action === "source") {
    sourceMode.value = !sourceMode.value;
    focus();
  } else void show(action);
}
function format(tag: string) {
  sourceMode.value = false;
  editor.value?.format(tag, tag === "url" ? link.value : "");
  closeSheet();
}
function emoji(value: string) {
  editor.value?.insert(value);
  closeSheet();
}
function attach(kind: Attachment["kind"], available = true) {
  draft.value.attachments.push({
    id: crypto.randomUUID(),
    name: kind === "photo" ? "weekend-photo.jpg" : "watch-notes.pdf",
    kind,
    owner: account.value,
    available,
  });
  save();
  closeSheet();
}
function reattach(id: string) {
  const file = draft.value.attachments.find((a) => a.id === id)!;
  file.owner = account.value;
  file.available = true;
  save();
  focus();
}
function removeAttachment(id: string) {
  draft.value.attachments = draft.value.attachments.filter((a) => a.id !== id);
  save();
  focus();
}
function writeAttempt(value: Attempt) {
  retain("attempt", value.id, value, refuseStorage.value);
  readStore();
}
async function scrollLatest() {
  await nextTick();
  props.scroller?.scrollTo({ top: props.scroller.scrollHeight });
}
function settle(id: string, outcome: string) {
  const attempt = records<Attempt>("attempt").find((a) => a.id === id);
  if (!attempt || attempt.status !== "sending") return;
  try {
    writeAttempt({ ...attempt, status: outcome as Attempt["status"] });
  } catch {
    storageError.value =
      "The reply result could not be saved. Its submitted text is retained.";
  }
}
function startSend(payload: Draft, priorId?: string) {
  readStore();
  if (
    pending.value ||
    composing.value ||
    storageError.value ||
    conflicts.value.length > 1
  )
    return;
  if (
    payload.attachments.some((a) => !a.available || a.owner !== account.value)
  )
    return;
  const attempt: Attempt = {
    id: crypto.randomUUID(),
    thread: props.thread.id,
    draft: copy(payload),
    actor: account.value,
    owner,
    status: "sending",
    time: Date.now(),
  };
  try {
    writeAttempt(attempt);
    if (priorId) {
      const prior = attempts.value.find((a) => a.id === priorId)!;
      writeAttempt({ ...prior, status: "superseded" });
    }
  } catch {
    storageError.value =
      "Reply was not sent: its submitted copy could not be saved.";
    return;
  }
  const outcome = nextOutcome.value;
  if (outcome !== "hold") {
    const timer = setTimeout(() => {
      timers.delete(timer);
      settle(attempt.id, outcome);
    }, 1600);
    timers.add(timer);
  }
  void scrollLatest();
  return attempt;
}
function send() {
  if (sendDisabled.value) return;
  const prior = editing.value;
  const attempt = startSend(draft.value, prior ?? undefined);
  if (!attempt) return;
  // Keep the submitted snapshot independently before clearing the authoring field.
  if (!save(emptyDraft())) return;
  draft.value = emptyDraft();
  if (prior) {
    editing.value = null;
    readStore(true, true);
  }
  toolsOpen.value = false;
  focus();
}
function retry(attempt: Attempt) {
  if (pending.value) return;
  if (
    attempt.draft.attachments.some(
      (a) => !a.available || a.owner !== account.value,
    )
  ) {
    editFailed(attempt);
    return;
  }
  startSend(attempt.draft, attempt.id);
}
function editFailed(attempt: Attempt) {
  if (composing.value || !save()) return;
  editing.value = attempt.id;
  const tips = heads(nodes.value, context.value);
  draft.value = copy(tips[0]?.draft ?? attempt.draft);
  base.value = tips.map((n) => n.id);
  save();
  focus();
}
function returnToDraft() {
  if (!save()) return;
  editing.value = null;
  readStore(true, true);
  focus();
}
function check(attempt: Attempt) {
  try {
    writeAttempt({
      ...attempt,
      status: checkOutcome.value as Attempt["status"],
    });
  } catch {
    storageError.value = "Could not retain the checked result. Try again.";
  }
}
function choose(version: Revision) {
  const tips = heads(nodes.value, context.value);
  try {
    for (const tip of tips) retain("kept", tip.id, tip, refuseStorage.value);
  } catch {
    storageError.value =
      "Both versions must be saved before choosing. Try saving again.";
    return;
  }
  draft.value = copy(version.draft);
  if (
    save(
      draft.value,
      tips.map((t) => t.id),
    )
  ) {
    status.value =
      "Draft selected. Both versions are kept in Saved alternatives.";
    closeSheet();
  }
}
function restoreAlternative(version: Revision) {
  const tips = heads(nodes.value, context.value);
  try {
    for (const tip of tips) retain("kept", tip.id, tip, refuseStorage.value);
  } catch {
    storageError.value = "Current writing could not be kept. Try again.";
    return;
  }
  draft.value = copy(version.draft);
  save(
    draft.value,
    tips.map((t) => t.id),
  );
  closeSheet();
}
function simulateConflict() {
  const current = heads(nodes.value, context.value)[0];
  if (!current) {
    update("My unfinished reply");
  }
  const node = heads(nodes.value, context.value)[0]!;
  revise(
    context.value,
    { ...copy(node.draft), source: "A different version from another tab." },
    node.parents,
  );
  readStore();
  sheet.value?.close();
}
function storageEvent(event: StorageEvent) {
  if (event.key?.startsWith(prefix)) readStore(true);
}
function changeAccount() {
  account.value =
    account.value === "Sample account A"
      ? "Sample account B"
      : "Sample account A";
}
function recoverStorage() {
  refuseStorage.value = false;
  if (save()) {
    status.value = "Draft saved.";
    void focus();
  }
}
function simulateIME() {
  // Dispatch only through the same public DOM event path used by actual typing.
  sheet.value?.close();
  focus();
  nextTick(() => {
    const field = editor.value?.$el.querySelector(
      '[contenteditable="true"],textarea',
    );
    field?.dispatchEvent(
      new CompositionEvent("compositionstart", { bubbles: true }),
    );
    field?.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Enter",
        isComposing: true,
        bubbles: true,
        cancelable: true,
      }),
    );
    field?.dispatchEvent(
      new CompositionEvent("compositionend", { bubbles: true }),
    );
    status.value = "Simulated IME confirmation: no reply sent.";
  });
}
function finishHeld() {
  for (const item of threadAttempts.value.filter((a) => a.status === "sending"))
    settle(item.id, "sent");
}
function reset() {
  // Explicit preview-only reset, never touches the real workspace namespace.
  for (const timer of timers) clearTimeout(timer);
  timers.clear();
  const keys = Array.from({ length: localStorage.length }, (_, i) =>
    localStorage.key(i)!,
  );
  for (const key of keys)
    if (key.startsWith(prefix)) localStorage.removeItem(key);
  editing.value = null;
  draft.value = emptyDraft();
  base.value = [];
  nodes.value = [];
  attempts.value = [];
  storageError.value = "";
  refuseStorage.value = false;
  pauseUpdates.value = false;
  status.value = "";
  nextOutcome.value = "sent";
  account.value = "Sample account A";
  sourceMode.value = false;
  expanded.value = false;
  readStore();
  closeSheet();
}
watch(
  () => props.thread.id,
  () => {
    editing.value = null;
    toolsOpen.value = false;
    status.value = "";
    readStore(true, true);
  },
);
watch(composing, (value) => {
  if (!value) readStore(true);
});
onMounted(() => {
  readStore(true, true);
  // A prior page's pending simulation has no trustworthy completion after reload.
  for (const attempt of attempts.value.filter(
    (a) => a.status === "sending" && a.owner === owner,
  )) {
    try {
      writeAttempt({ ...attempt, status: "unknown" });
    } catch {
      storageError.value = "Could not retain the interrupted reply.";
    }
  }
  window.addEventListener("storage", storageEvent);
});
onBeforeUnmount(() => {
  window.removeEventListener("storage", storageEvent);
  for (const timer of timers) clearTimeout(timer);
});
function canNavigate() {
  if (composing.value || storageError.value) {
    status.value = composing.value
      ? "Finish entering text before switching threads."
      : "Save your current writing before switching threads.";
    return false;
  }
  return true;
}
defineExpose({ address, canNavigate, scenarios: () => show("scenarios") });
</script>

<template>
  <Teleport v-if="scroller" :to="scroller">
    <section
      v-if="threadAttempts.length"
      class="cf-attempts"
      aria-label="Your reply submissions"
    >
      <article
        v-for="item in threadAttempts"
        :key="item.id"
        class="cf-attempt"
        :data-status="item.status"
        :aria-label="`Reply · ${item.status}`"
      >
        <small v-if="item.draft.target"
          >↳ {{ item.draft.target.author }} · #{{
            item.draft.target.floor
          }}</small
        >
        <ComposerEditor :model-value="item.draft.source" read-only />
        <p v-if="item.draft.attachments.length" class="cf-attachment-list">
          {{ item.draft.attachments.map((a) => a.name).join(" · ") }}
        </p>
        <div class="cf-attempt-status" role="status">
          <span>{{
            item.status === "sending"
              ? "Sending…"
              : item.status === "sent"
                ? "Sent"
                : item.status === "failed"
                  ? "Not sent"
                  : "Unconfirmed"
          }}</span>
          <template v-if="item.status === 'failed'"
            ><button :disabled="pending" @click="retry(item)">Retry</button
            ><button @click="editFailed(item)">Edit</button></template
          >
          <button v-if="item.status === 'unknown'" @click="check(item)">
            Check status
          </button>
        </div>
      </article>
    </section>
  </Teleport>
  <section
    class="cf-composer"
    :class="{ 'cf-expanded': expanded }"
    aria-label="Reply composer"
  >
    <div v-if="editing" class="cf-notice">
      <span>Editing an unsent reply · your newer draft is kept</span
      ><button @click="returnToDraft">Back to draft</button>
    </div>
    <div v-if="draft.target" class="cf-target">
      <div>
        <strong
          >Reply to {{ draft.target.author }} · #{{
            draft.target.floor
          }}</strong
        >
        <p>{{ draft.target.text }}</p>
      </div>
      <button
        aria-label="Quote this post"
        title="Insert quoted text"
        :disabled="composing"
        @click="quoteTarget"
      >
        ❞
      </button>
      <button
        aria-label="Remove reply target"
        :disabled="composing"
        @click="removeTarget"
      >
        ×
      </button>
    </div>
    <div v-if="conflicts.length > 1" class="cf-notice cf-warning">
      <span>Two drafts changed separately. Both are kept.</span
      ><button @click="show('conflicts')">Choose draft</button>
    </div>
    <div v-if="storageError" class="cf-notice cf-warning" role="alert">
      <span>{{ storageError }}</span
      ><button @click="recoverStorage">Try saving again</button>
    </div>
    <div
      v-if="draft.attachments.length"
      class="cf-attachments"
      aria-label="Reply attachments"
    >
      <div
        v-for="file in draft.attachments"
        :key="file.id"
        class="cf-file"
        :class="{
          'cf-file-unavailable': !file.available || file.owner !== account,
        }"
      >
        <span class="cf-file-icon" aria-hidden="true">{{
          file.kind === "photo" ? "▧" : "▤"
        }}</span>
        <div>
          <strong>{{ file.name }}</strong
          ><small v-if="!file.available || file.owner !== account"
            >Attachment unavailable</small
          ><small v-else>Ready</small>
        </div>
        <button
          v-if="!file.available || file.owner !== account"
          @click="reattach(file.id)"
        >
          Reattach
        </button>
        <button
          :aria-label="`Remove ${file.name}`"
          @click="removeAttachment(file.id)"
        >
          ×
        </button>
      </div>
    </div>
    <div class="cf-input-shell">
      <div class="cf-input-body">
        <ComposerEditor
          :key="context"
          ref="editor"
          :model-value="draft.source"
          :source-mode="sourceMode"
          @update:model-value="update"
          @send="send"
          @ready="ready = $event"
          @composing="composing = $event"
        />
        <button
          class="cf-expand"
          :aria-label="expanded ? 'Collapse composer' : 'Expand composer'"
          :title="expanded ? 'Collapse' : 'Expand'"
          :disabled="composing"
          @click="
            expanded = !expanded;
            focus();
          "
        >
          {{ expanded ? "↙" : "↗" }}
        </button>
      </div>
      <div class="cf-actions">
        <div class="cf-plus-wrap">
          <button
            class="cf-plus"
            aria-label="Writing tools"
            :aria-expanded="toolsOpen"
            :disabled="composing"
            @click="toolsOpen = !toolsOpen"
          >
            ＋
          </button>
          <div
            v-if="toolsOpen"
            class="cf-tools"
            role="group"
            aria-label="Writing tools menu"
            @keydown.esc="
              toolsOpen = false;
              focus();
            "
          >
            <button @click="tool('attachments')">
              ▧ <span>Image or attachment</span>
            </button>
            <button @click="tool('emoji')">☺ <span>Emoji</span></button>
            <button @click="tool('format')">Aa <span>Formatting</span></button>
            <button @click="tool('source')">
              &lt;/&gt;
              <span>{{ sourceMode ? "Visual editor" : "BBCode source" }}</span>
            </button>
            <button @click="tool('preview')">◉ <span>Preview</span></button>
          </div>
        </div>
        <span class="cf-key-hint">{{
          sourceMode
            ? "BBCode · Ctrl/⌘ Enter to send"
            : "Enter to send · Shift Enter for a new line"
        }}</span>
        <button
          class="cf-send"
          :disabled="sendDisabled"
          aria-label="Send reply"
          @click="send"
        >
          Send <span aria-hidden="true">↑</span>
        </button>
      </div>
    </div>
    <p v-if="pending" class="cf-inline-status" role="status">
      You can keep writing. Waiting for the previous reply’s result.
    </p>
    <p v-if="status" class="cf-inline-status" role="status">{{ status }}</p>
  </section>
  <dialog
    ref="sheet"
    class="cf-sheet"
    aria-labelledby="cf-sheet-title"
    @close="focus()"
  >
    <header>
      <h2 id="cf-sheet-title">{{ sheetTitles[sheetKind] }}</h2>
      <button aria-label="Close composer dialog" @click="closeSheet">×</button>
    </header>
    <template v-if="sheetKind === 'preview'"
      ><p v-if="draft.target">
        Reply to {{ draft.target.author }} · #{{ draft.target.floor }}
      </p>
      <ComposerEditor :model-value="draft.source" read-only />
      <p v-for="file in draft.attachments" :key="file.id">{{ file.name }}</p>
      <p class="cf-caption">Local rendering preview.</p></template
    >
    <div v-else-if="sheetKind === 'format'" class="cf-format-tools">
      <button @mousedown.prevent @click="format('b')"><b>Bold</b></button
      ><button @mousedown.prevent @click="format('i')"><i>Italic</i></button
      ><button @mousedown.prevent @click="format('u')"><u>Underline</u></button
      ><button @mousedown.prevent @click="format('quote')">Quote</button
      ><label
        >Link address<input v-model="link" aria-label="Link address" /></label
      ><button @mousedown.prevent @click="format('url')">Apply link</button>
    </div>
    <div v-else-if="sheetKind === 'emoji'" class="cf-emoji">
      <button
        v-for="value in ['🙂', '😊', '👍', '❤️', '🎉', '🙏', '✨', '🍵']"
        :key="value"
        :aria-label="`Insert ${value}`"
        @click="emoji(value)"
      >
        {{ value }}
      </button>
    </div>
    <template v-else-if="sheetKind === 'attachments'"
      ><p class="cf-caption">Preview samples · no file is uploaded</p>
      <div class="cf-sample-files">
        <button @click="attach('photo')">▧ Add sample photo</button
        ><button @click="attach('file')">▤ Add sample file</button>
      </div></template
    >
    <template v-else-if="sheetKind === 'conflicts'"
      ><p>
        Choose which version to continue. Both versions remain in Saved
        alternatives.
      </p>
      <article
        v-for="(version, index) in conflicts"
        :key="version.id"
        class="cf-version"
      >
        <strong>Version {{ index + 1 }}</strong>
        <pre>{{ version.draft.source || "(Empty reply)" }}</pre>
        <p v-if="version.draft.target">
          Reply to {{ version.draft.target.author }}
        </p>
        <p v-if="version.draft.attachments.length">
          {{ version.draft.attachments.map((a) => a.name).join(" · ") }}
        </p>
        <button @click="choose(version)">
          Continue version {{ index + 1 }}
        </button>
      </article></template
    >
    <template v-else-if="sheetKind === 'alternatives'"
      ><p>
        Choosing a saved version keeps your current draft as another
        alternative.
      </p>
      <article
        v-for="(version, index) in savedVersions.filter(
          (v) => v.thread === context,
        )"
        :key="version.id"
        class="cf-version"
      >
        <pre>{{ version.draft.source || "(Empty reply)" }}</pre>
        <button @click="restoreAlternative(version)">
          Restore alternative {{ index + 1 }}
        </button>
      </article></template
    >
    <div v-else class="cf-lab">
      <p>
        Fictional posts · local simulation. Drafts are retained only in this
        localhost prototype’s separate scratch storage. No forum sends, uploads
        or sign-in changes occur.
      </p>
      <label
        >Next send result<select
          v-model="nextOutcome"
          aria-label="Next send result"
        >
          <option value="sent">Success</option>
          <option value="failed">Failed · not sent</option>
          <option value="unknown">Unconfirmed</option>
          <option value="hold">Keep sending</option>
        </select></label
      >
      <label
        >Check status result<select
          v-model="checkOutcome"
          aria-label="Check status result"
        >
          <option value="sent">Confirmed sent</option>
          <option value="failed">Confirmed not sent</option>
          <option value="unknown">Still unconfirmed</option>
        </select></label
      >
      <button
        @click="
          finishHeld();
          closeSheet();
        "
      >
        Confirm pending reply
      </button>
      <button @click="changeAccount">
        Switch simulated account · {{ account }}
      </button>
      <button @click="attach('photo', false)">
        Add unavailable attachment
      </button>
      <button @click="simulateConflict">Create a conflicting draft</button>
      <button @click="show('alternatives')">Saved alternatives</button>
      <label
        ><input v-model="refuseStorage" type="checkbox" />Simulate storage
        refusal</label
      >
      <label
        ><input v-model="pauseUpdates" type="checkbox" />Pause incoming draft
        updates in this tab</label
      >
      <button @click="simulateIME">Simulate IME Enter confirmation</button>
      <button @click="reset">Reset prototype data</button>
      <details>
        <summary>Inspect prototype state</summary>
        <pre>{{
          JSON.stringify(
            {
              thread: thread.id,
              context,
              draft,
              account,
              base,
              conflictHeads: conflicts.map((n) => n.id),
              attempts: threadAttempts,
              sourceMode,
              expanded,
              composing,
              storageError,
              pauseUpdates,
            },
            null,
            2,
          )
        }}</pre>
      </details>
    </div>
  </dialog>
</template>
