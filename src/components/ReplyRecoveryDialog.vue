<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import {
  DialogRoot,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "reka-ui";
import ReplyConflict from "./ReplyConflict.vue";
import WorkspaceIcon from "./WorkspaceIcon.vue";
import type { Workspace } from "../workspace";
import { strings, description } from "../layouts/strings";
const props = defineProps<{ workspace: Workspace; portal: HTMLElement }>();
const open = ref(false);
const feedback = ref<HTMLElement | null>(null);
const touched = ref<string | null>(null);
const text = computed(() =>
  strings(props.workspace.preferences.state.value.language),
);
const activeThread = computed(
  () => props.workspace.writing.state.value.context?.replyTarget?.threadId,
);
const conflicts = computed(
  () =>
    props.workspace.state.value.replyRecovery?.conflicts.filter(
      (row) => row.threadId !== activeThread.value,
    ) ?? [],
);
const alternatives = computed(
  () =>
    props.workspace.state.value.replyRecovery?.alternatives.filter(
      (row) => row.threadId !== activeThread.value,
    ) ?? [],
);
const count = computed(
  () =>
    conflicts.value.reduce((sum, row) => sum + row.variants.length, 0) +
    alternatives.value.reduce(
      (sum, row) => sum + (row.retained?.length ?? 0),
      0,
    ),
);
const resolution = computed(() =>
  props.workspace.replyResolution.value?.threadId === touched.value
    ? props.workspace.replyResolution.value
    : null,
);
function changeOpen(value: boolean) {
  const change = () => {
    open.value = value;
  };
  if (!props.workspace.writing.deferViewChange(change)) change();
}
function escape(event: KeyboardEvent) {
  event.preventDefault();
  event.stopPropagation();
  if (event.isComposing || event.keyCode === 229) return;
  changeOpen(false);
}
watch(
  resolution,
  async (value) => {
    if (!open.value || !value || value.busy) return;
    await nextTick();
    feedback.value?.focus({ preventScroll: true });
    feedback.value?.scrollIntoView({ block: "nearest" });
  },
  { flush: "post" },
);
</script>
<template>
  <DialogRoot
    v-if="count || open || resolution"
    :open="open"
    @update:open="changeOpen"
  >
    <DialogTrigger as-child>
      <button
        class="header-action reply-recovery-trigger"
        :aria-label="`${text.replyRecoveryDialog} · ${count}`"
        :title="`${text.replyRecoveryDialog} · ${count}`"
      >
        <WorkspaceIcon name="drafts" /><span class="header-action-label">{{
          text.replyRecoveryDialog
        }}</span
        ><span>{{ count }}</span>
      </button>
    </DialogTrigger>
    <DialogPortal :to="portal">
      <DialogOverlay class="dialog-overlay" />
      <DialogContent
        class="dialog-content reply-recovery-dialog"
        @interact-outside.prevent
        @keydown.esc="escape"
      >
        <DialogTitle>{{ text.replyRecoveryDialog }}</DialogTitle>
        <DialogDescription>{{
          text.replyRecoveryDialogDescription
        }}</DialogDescription>
        <ReplyConflict
          v-for="row in conflicts"
          :key="row.threadId"
          :row="row"
          :language="workspace.preferences.state.value.language"
          :busy="workspace.replyResolution.value?.busy ?? false"
          @choose="
            (row, version) => {
              touched = row.threadId;
              workspace.chooseReply(JSON.parse(JSON.stringify(row)), version);
            }
          "
          @discard="
            (row, version) => {
              touched = row.threadId;
              workspace.discardReply(row, version);
            }
          "
        />
        <ReplyConflict
          v-for="row in alternatives"
          :key="'alternative-' + row.threadId"
          :row="row"
          alternatives
          :language="workspace.preferences.state.value.language"
          :busy="workspace.replyResolution.value?.busy ?? false"
          @choose="
            (row, version) => {
              touched = row.threadId;
              workspace.chooseReply(JSON.parse(JSON.stringify(row)), version);
            }
          "
          @discard="
            (row, version) => {
              touched = row.threadId;
              workspace.discardReply(row, version);
            }
          "
        />
        <p v-if="resolution" ref="feedback" role="status" tabindex="-1">
          {{
            description(
              resolution.message,
              workspace.preferences.state.value.language,
            )
          }}
        </p>
        <button @click="changeOpen(false)">{{ text.close }}</button>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
