<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted, type Ref } from "vue";
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "reka-ui";
import type { Workspace } from "../workspace";
import WorkspaceLayout from "./WorkspaceLayout.vue";
import Board from "./InformationBoard.prototype.vue";
import Switcher from "../components/PrototypeSwitcher.vue";
const props = defineProps<{
  workspace: Workspace;
  portal: HTMLElement;
  note: Ref<string>;
  requests: { url: string; method: string; body: string | null }[];
}>();
const emit = defineEmits<{ dismiss: [] }>();
const variants = [
  {
    key: "A",
    name: "Title first",
    description: "Choose a discussion; inspect history on demand.",
  },
  {
    key: "B",
    name: "Activity first",
    description: "Enter at the latest reply; keep the thread in context.",
  },
  {
    key: "C",
    name: "Index + inspector",
    description: "Scan titles, inspect a choice, then open it.",
  },
];
const readVariant = () => {
  const key = new URL(location.href).searchParams.get("variant");
  return variants.some((v) => v.key === key) ? key! : "A";
};
const variant = ref(readVariant());
const inspect = ref(false);
const lab = ref<"rating" | "report" | null>(null);
const outcome = ref(false);
const reason = ref("Advertising");
const other = ref("");
const reportMessage = computed(() =>
  reason.value === "Other" ? other.value : reason.value,
);
const state = computed(() => ({
  selectedDirection: "A",
  variant: variant.value,
  hypothesis: variants.find((v) => v.key === variant.value)!.description,
  selectedThread: props.workspace.state.value.selection,
  destination: props.workspace.state.value.destination,
  writing: props.workspace.writing.snapshot(),
  preferences: props.workspace.preferences.state.value,
  storage: "Memory only; reload resets writing and preferences",
  transport: "Synthetic local responses; no live forum requests",
  fixtureRequests: props.requests.map((r) => ({
    method: r.method,
    url: r.url,
  })),
}));
function choose(value: string) {
  variant.value = value;
  const url = new URL(location.href);
  url.searchParams.set("variant", value);
  history.replaceState(null, "", url);
}
const pop = () => {
  variant.value = readVariant();
};
onMounted(() => window.addEventListener("popstate", pop));
onUnmounted(() => window.removeEventListener("popstate", pop));
watch(
  variant,
  () =>
    console.info("Prototype state", JSON.parse(JSON.stringify(state.value))),
  { immediate: true },
);
function openLab(value: "rating" | "report") {
  inspect.value = false;
  outcome.value = false;
  lab.value = value;
}
</script>
<template>
  <WorkspaceLayout :workspace="workspace" :portal="portal">
    <template #prototype-board="data"
      ><Board v-bind="data" :variant="variant"
    /></template>
    <template #prototype-writing="{ expanded, context, reading }">
      <details
        v-if="expanded && context?.replyTarget"
        class="prototype-writing-destination"
      >
        <summary>
          Reply ·
          {{
            reading?.thread.id === context.replyTarget.threadId
              ? reading.thread.title
              : `Thread ${context.replyTarget.threadId}`
          }}
        </summary>
        <p>
          {{ reading?.thread.parent?.label }} · Thread
          {{ context.replyTarget.threadId
          }}<span v-if="context.replyTarget.postId">
            · Post {{ context.replyTarget.postId }}</span
          >
        </p>
      </details>
    </template>
  </WorkspaceLayout>
  <div v-if="note.value" class="prototype-note" role="status">
    {{ note.value }}<button @click="emit('dismiss')">Dismiss</button>
  </div>
  <Switcher
    :current="variant"
    :variants="variants"
    :summary="`${variant === 'A' ? 'Selected' : 'Comparison'} · synthetic data · memory only`"
    @change="choose"
    @inspect="inspect = true"
  />
  <DialogRoot v-model:open="inspect"
    ><DialogPortal :to="portal"
      ><DialogOverlay class="dialog-overlay" /><DialogContent
        class="dialog-content prototype-inspection"
        ><DialogTitle>Information hierarchy experiment</DialogTitle
        ><DialogDescription
          >Which hierarchy helps you choose a discussion while keeping its
          meaning intact?</DialogDescription
        >
        <p>
          A is the selected direction. B and C remain comparison references.
        </p>
        <p>{{ variants.find((v) => v.key === variant)?.description }}</p>
        <p>
          Try opening a thread, writing a reply, expanding it, then switching
          variants. The reader and editor stay mounted. Reload clears this
          sample session. Sending, uploads and persistent recovery are outside
          this prototype.
        </p>
        <label
          >Variant<select
            :value="variant"
            @change="choose(($event.target as HTMLSelectElement).value)"
          >
            <option v-for="item in variants" :key="item.key" :value="item.key">
              {{ item.key }} · {{ item.name }}
            </option>
          </select></label
        >
        <div class="prototype-scenarios">
          <button @click="openLab('rating')">Try a rating receipt</button
          ><button @click="openLab('report')">Try report uncertainty</button>
        </div>
        <details open>
          <summary>Current prototype state</summary>
          <pre>{{ JSON.stringify(state, null, 2) }}</pre>
        </details>
        <button @click="inspect = false">Close</button>
      </DialogContent></DialogPortal
    ></DialogRoot
  >
  <DialogRoot :open="lab !== null" @update:open="!$event && (lab = null)"
    ><DialogPortal :to="portal"
      ><DialogOverlay class="dialog-overlay" /><DialogContent
        class="dialog-content prototype-receipt"
        ><DialogTitle>{{
          lab === "rating"
            ? outcome
              ? "Rating confirmed"
              : "Rate this post"
            : outcome
              ? "Report receipt is uncertain"
              : "Report this post"
        }}</DialogTitle
        ><DialogDescription
          >Synthetic example · 小森 · 最近循環播放的是哪一首？ · Post
          4201</DialogDescription
        >
        <template v-if="!outcome"
          ><template v-if="lab === 'rating'"
            ><p>Sample selection: +2 天使币 · Reason: Thanks for sharing.</p>
            <p>
              Notification requested; delivery cannot be established here.
            </p></template
          ><template v-else
            ><p>Send the selected reason to moderators.</p>
            <label
              >Reason<select v-model="reason">
                <option>Advertising</option>
                <option>Off-topic</option>
                <option>Other</option>
              </select></label
            ><label v-if="reason === 'Other'"
              >Your reason<textarea v-model="other" /><small
                >{{ Array.from(other).length }} / 200</small
              ></label
            ></template
          ><button @click="lab = null">Cancel</button
          ><button
            :disabled="
              lab === 'report' &&
              (!reportMessage.trim() || Array.from(reportMessage).length > 200)
            "
            @click="outcome = true"
          >
            Simulate submission
          </button></template
        >
        <template v-else
          ><p v-if="lab === 'rating'" class="prototype-receipt-lead">
            +2 天使币
          </p>
          <p v-else>
            The forum may have received this report. It will not be retried;
            independent status is unavailable.
          </p>
          <details>
            <summary>Submitted details</summary>
            <dl>
              <dt>Original member</dt>
              <dd>Prototype member · 7</dd>
              <dt>Thread / post</dt>
              <dd>42 / 4201</dd>
              <dt>{{ lab === "rating" ? "Score / reason" : "Reason" }}</dt>
              <dd>
                {{
                  lab === "rating"
                    ? "+2 天使币 · Thanks for sharing"
                    : reportMessage
                }}
              </dd>
            </dl>
            <p v-if="lab === 'rating'">
              Notification requested; delivery unverified.
            </p>
          </details>
          <button @click="lab = null">Close</button></template
        >
      </DialogContent></DialogPortal
    ></DialogRoot
  >
</template>
