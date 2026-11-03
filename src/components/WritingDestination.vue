<script setup lang="ts">
import { computed, type DeepReadonly } from "vue";
import type { PreparedWriting } from "../forum-client";
import type { Preferences } from "../workspace/preferences";
import { strings, insert } from "../layouts/strings";
const props = defineProps<{
  writing: DeepReadonly<PreparedWriting>;
  language: Preferences["language"];
  review?: boolean;
  compact?: boolean;
}>();
const text = computed(() => strings(props.language));
const action = computed(() =>
  props.writing.action === "edit-post"
    ? insert(text.value.editPost, props.writing.editTarget?.postId ?? "")
    : props.writing.replyTarget?.postId
      ? text.value.quickQuote
      : props.writing.replyTarget
        ? text.value.replyToThread
        : props.writing.draft
          ? insert(text.value.draftIn, props.writing.board.label)
          : text.value.newThread,
);
</script>
<template>
  <div
    class="writing-destination"
    role="group"
    :aria-label="review ? text.reviewDestination : text.writingDestination"
  >
    <p>
      <strong>{{ action }}</strong> ·
      {{ insert(text.writingAs, writing.account.name) }} ({{
        writing.account.id
      }})
    </p>
    <p>
      {{ writing.board.label }} ·
      {{ insert(text.writingBoard, writing.board.id)
      }}<template v-if="writing.replyTarget || writing.editTarget">
        ·
        {{
          insert(
            text.writingThread,
            writing.replyTarget?.threadId ?? writing.editTarget?.threadId ?? "",
          )
        }}</template
      >
    </p>
    <p v-if="writing.replyTarget?.postId">
      {{
        review
          ? `${writing.replyTarget.author} · ${text.post} ${writing.replyTarget.postId}`
          : insert(text.addressedTo, writing.replyTarget.author).replace(
              "{post}",
              writing.replyTarget.postId,
            )
      }}
    </p>
    <p v-if="writing.replyTarget?.postId && !review && !compact">
      {{ text.addressedExplanation }}
    </p>
    <p v-else-if="writing.replyTarget && !compact">
      {{ text.replyDeliveryUnknown }}
    </p>
  </div>
</template>
