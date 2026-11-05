<script setup lang="ts">
import { privateWritingText } from "./private-writing-text";
import RetainedPublicAttempts from "./RetainedPublicAttempts.vue";
import PrivateAttemptHistory from "./PrivateAttemptHistory.vue";
import { computed, ref, watch, nextTick } from "vue";
import type { Workspace } from "../workspace";
import PostEditor from "./PostEditor.vue";
import WritingDestination from "./WritingDestination.vue";
import { nativeDestination } from "../hosts/browser";
const props = defineProps<{ workspace: Workspace; expanded: boolean }>();
const state = props.workspace.writing.state;
const t = (value: string) =>
  privateWritingText(value, props.workspace.preferences.state.value.language);
const context = computed(() =>
  state.value.context?.action === "private-message"
    ? state.value.context
    : null,
);
const editor = ref<InstanceType<typeof PostEditor> | null>(null);
watch(
  () => props.expanded,
  () => editor.value?.focus(true),
);
watch(
  () => state.value.validationFocus,
  async () => {
    await nextTick();
    if (
      state.value.validationIssues[0]?.field === "source" &&
      !state.value.composing
    )
      editor.value?.focus(false, true);
  },
);
</script>
<template>
  <template v-if="context">
    <h1>{{ t("Private message") }}</h1>
    <WritingDestination
      :writing="context"
      :language="workspace.preferences.state.value.language"
    />
    <p>
      {{
        t(
          "Plain text and line breaks. Formatting, attachments and group messages are not supported here.",
        )
      }}
    </p>
    <p v-if="context.maxLength !== null">
      {{
        t("Current maximum: {value} characters.").replace(
          "{value}",
          String(context.maxLength),
        )
      }}
    </p>
    <p role="status">
      {{
        state.recoveryAvailable && state.acknowledged === context.revision
          ? t("Current writing is retained for this browser page session.")
          : t("Recovery is not yet acknowledged. Keep this page open.")
      }}
    </p>
    <p v-if="!state.accountVerified" role="alert">
      {{
        t("Sending paused until the current account and recipient are checked.")
      }}
    </p>
    <PostEditor
      ref="editor"
      :workspace="workspace"
      :expanded="expanded"
      plain
    />
    <p v-if="state.message" role="alert">{{ t(state.message) }}</p>

    <section
      v-if="state.privateReview"
      :aria-label="t('Prepared private message review')"
    >
      <WritingDestination
        :writing="state.privateReview.submission.writing"
        :language="workspace.preferences.state.value.language"
        review
      />
      <pre class="prepared-source">{{
        state.privateReview.submission.writing.source
      }}</pre>
      <p v-if="!state.privateReviewConsumed">
        {{
          t(
            "Reviewing has not sent this message. Sending will store this exact text for this recipient. Delivery and read status remain unknown.",
          )
        }}
      </p>
      <p v-else>
        {{
          t(
            "This review has been used. Check its original outcome below; this approval cannot send again.",
          )
        }}
      </p>
      <button
        :disabled="
          state.privateReviewConsumed ||
          state.preparing ||
          state.publishing ||
          state.composing
        "
        @click="workspace.writing.sendPrivate()"
      >
        {{ t("Send this private message") }}
      </button>
      <button @click="workspace.writing.cancelPublicationReview()">
        {{ t("Return to private writing") }}
      </button>
    </section>
    <PrivateAttemptHistory :workspace="workspace" />
    <RetainedPublicAttempts :workspace="workspace" />
    <a :href="nativeDestination(context.recipient.url)">{{
      t("Continue in native forum")
    }}</a>
  </template>
</template>
