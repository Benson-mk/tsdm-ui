<script setup lang="ts">
import { computed, ref, watch } from "vue";
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "reka-ui";
import { strings, insert } from "../layouts/strings";
import type { Workspace } from "../workspace";
const props = defineProps<{
  workspace: Workspace;
  portal: HTMLElement;
  postId: string;
}>();
const emit = defineEmits<{ "close-auto-focus": [event: Event] }>();
const text = computed(() =>
  strings(props.workspace.preferences.state.value.language),
);
const state = computed(() => props.workspace.report.value);
const form = computed(() =>
  state.value?.preparation?.kind === "ready"
    ? state.value.preparation.form
    : null,
);
const selected = ref(""),
  message = ref(""),
  composing = ref(false);
watch(form, () => {
  selected.value = "";
  message.value = "";
});
const count = computed(() => Array.from(message.value).length);
const valid = computed(
  () =>
    !!form.value &&
    form.value.reasons.includes(selected.value) &&
    !!message.value.trim() &&
    count.value <= form.value.maximum,
);
const outcome = computed(() =>
  state.value?.result?.kind === "uncertain"
    ? text.value.reportUncertain
    : state.value?.result?.kind === "rejected"
      ? text.value.reportRejected +
        state.value.result.message.replace(/^Report rejected: /, "")
      : state.value?.result?.message,
);
function choose(reason: string, index: number) {
  selected.value = reason;
  message.value = index === form.value!.reasons.length - 1 ? "" : reason;
}
function escape(event: KeyboardEvent) {
  if (event.defaultPrevented) return;
  event.preventDefault();
  event.stopPropagation();
  if (event.isComposing || event.keyCode === 229 || composing.value) return;
  props.workspace.closeReport();
}
</script>
<template>
  <DialogRoot
    :open="state?.target.postId === postId"
    @update:open="!$event && workspace.closeReport()"
  >
    <DialogPortal :to="portal"
      ><DialogOverlay class="dialog-overlay" /><DialogContent
        class="dialog-content report-dialog"
        @interact-outside.prevent
        @keydown.esc="escape"
        @compositionstart="composing = true"
        @compositionend="composing = false"
        @close-auto-focus="emit('close-auto-focus', $event)"
      >
        <DialogTitle>{{ insert(text.reportTitle, postId) }}</DialogTitle>
        <DialogDescription
          >{{ state?.target.author }} · {{ state?.target.threadId }} ·
          {{ text.reportDescription }}</DialogDescription
        >
        <p v-if="state?.loading" role="status">
          {{ form ? text.reportSubmitting : text.reportChecking }}
        </p>
        <p v-else-if="state?.preparation?.kind === 'unavailable'" role="status">
          {{ state.preparation.message }}
        </p>
        <fieldset v-if="form" :disabled="state?.loading || !!state?.result">
          <legend>{{ insert(text.reportActor, form.target.accountId) }}</legend>
          <label v-for="(reason, index) in form.reasons" :key="reason"
            ><input
              type="radio"
              :name="`report-choice-${postId}`"
              :value="reason"
              :checked="selected === reason"
              @change="choose(reason, index)"
            />{{ reason }}</label
          >
          <label v-if="selected === form.reasons.at(-1)"
            >{{ text.reportContent }}<textarea v-model="message" />
          </label>
          <p v-if="selected && selected !== form.reasons.at(-1)">
            {{ message }}
          </p>
          <p>{{ count }} / {{ form.maximum }}</p>
        </fieldset>
        <p v-if="state?.result" role="status">{{ outcome }}</p>
        <button
          v-if="form && !state?.result"
          :disabled="state?.loading || !valid"
          @click="workspace.submitReport({ reason: selected, message })"
        >
          {{ text.reportSubmit }}
        </button>
        <button
          :disabled="state?.loading && !!form"
          @click="workspace.closeReport()"
        >
          {{ text.pageCancel }}
        </button>
      </DialogContent></DialogPortal
    ></DialogRoot
  >
</template>
