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
import { strings, insert, description } from "../layouts/strings";
import type { Workspace } from "../workspace";
const props = defineProps<{
  workspace: Workspace;
  portal: HTMLElement;
  postId: string;
}>();
const composing = ref(false);
function escape(event: KeyboardEvent) {
  if (event.defaultPrevented) return;
  event.preventDefault();
  event.stopPropagation();
  if (event.isComposing || event.keyCode === 229 || composing.value) return;
  props.workspace.closeRating();
}
const emit = defineEmits<{ "close-auto-focus": [event: Event] }>();
const text = computed(() =>
  strings(props.workspace.preferences.state.value.language),
);
const details = computed(() =>
  text.value.ratingDescription
    .replace("{author}", state.value?.target.author ?? "")
    .replace("{thread}", state.value?.target.threadId ?? "")
    .replace("{post}", props.postId),
);
const outcome = computed(() => {
  const result = state.value?.result;
  if (!result) return "";
  return result.kind === "confirmed"
    ? text.value.ratingConfirmed
    : result.kind === "uncertain"
      ? text.value.ratingUncertain
      : result.kind === "rejected"
        ? text.value.ratingRejected +
          result.message.replace(/^Rating rejected: /, "")
        : description(
            result.message,
            props.workspace.preferences.state.value.language,
          );
});
const state = computed(() => props.workspace.rating.value);
const form = computed(() =>
  state.value?.preparation?.kind === "ready"
    ? state.value.preparation.form
    : null,
);
const scores = ref<Record<string, number>>({}),
  reason = ref(""),
  notify = ref(false);
const valid = computed(
  () =>
    !!form.value &&
    form.value.scores.some((score) => scores.value[score.name] !== 0) &&
    form.value.scores.every((score) => {
      const value = scores.value[score.name];
      return (
        typeof value === "number" &&
        Number.isSafeInteger(value) &&
        value >= score.minimum &&
        value <= score.maximum &&
        Math.abs(value) <= score.remaining
      );
    }),
);
watch(form, (value) => {
  scores.value = Object.fromEntries(
    value?.scores.map((s) => [s.name, 0]) ?? [],
  );
  reason.value = "";
  notify.value = value?.notify ?? false;
});
</script>
<template>
  <DialogRoot
    :open="state?.target.postId === postId"
    @update:open="!$event && workspace.closeRating()"
  >
    <DialogPortal :to="portal"
      ><DialogOverlay class="dialog-overlay" /><DialogContent
        class="dialog-content rating-dialog"
        @interact-outside.prevent
        @keydown.esc="escape"
        @compositionstart="composing = true"
        @compositionend="composing = false"
        @close-auto-focus="emit('close-auto-focus', $event)"
      >
        <DialogTitle>{{ insert(text.ratingTitle, postId) }}</DialogTitle>
        <DialogDescription>{{ details }}</DialogDescription>
        <p v-if="state?.loading" role="status">
          {{ form ? text.ratingSubmitting : text.ratingChecking }}
        </p>
        <p v-else-if="state?.preparation?.kind === 'unavailable'" role="status">
          {{ state.preparation.message }}
        </p>
        <fieldset v-if="form" :disabled="state?.loading || !!state?.result">
          <p>{{ insert(text.ratingActor, form.target.accountId) }}</p>
          <p v-if="form.notice">{{ form.notice }}</p>
          <label
            v-for="score in form.scores"
            :key="score.name"
            class="rating-score"
            >{{ score.label }} ({{
              text.ratingRange
                .replace("{min}", String(score.minimum))
                .replace("{max}", String(score.maximum))
                .replace("{remaining}", String(score.remaining))
            }})<input
              v-model.number="scores[score.name]"
              type="number"
              :min="score.minimum"
              :max="score.maximum"
              step="1"
          /></label>
          <label v-if="form.reasons.length"
            >{{ text.ratingSuggested
            }}<select
              @change="reason = ($event.target as HTMLSelectElement).value"
            >
              <option value="">{{ text.ratingChoose }}</option>
              <option
                v-for="suggestion in form.reasons"
                :key="suggestion"
                :value="suggestion"
              >
                {{ suggestion }}
              </option>
            </select></label
          >
          <label
            >{{ text.ratingReason }}<input v-model="reason" type="text"
          /></label>
          <label
            ><input v-model="notify" type="checkbox" />{{
              text.ratingNotify
            }}</label
          >
        </fieldset>
        <p v-if="state?.result" role="status">{{ outcome }}</p>
        <button
          v-if="form && !state?.result"
          :disabled="state?.loading || !valid"
          @click="
            workspace.submitRating({ scores: { ...scores }, reason, notify })
          "
        >
          {{ text.ratingSubmit }}
        </button>
        <button
          :disabled="state?.loading && !!form"
          @click="workspace.closeRating()"
        >
          {{ text.pageCancel }}
        </button>
      </DialogContent></DialogPortal
    ></DialogRoot
  >
</template>
