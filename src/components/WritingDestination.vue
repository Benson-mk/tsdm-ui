<script setup lang="ts">
import { privateWritingText } from "./private-writing-text";
import { computed, type DeepReadonly } from "vue";
import type { PreparedWriting, PreparedPrivateWriting } from "../forum-client";
import type { Preferences } from "../workspace/preferences";
import { strings, insert } from "../layouts/strings";
const props = defineProps<{
  writing: DeepReadonly<PreparedWriting | PreparedPrivateWriting>;
  language: Preferences["language"];
  review?: boolean;
  compact?: boolean;
}>();
const text = computed(() => strings(props.language));
const addressedURL = computed(() => {
  if (props.writing.action === "private-message") return "";
  const target = props.writing.replyTarget;
  if (!target?.postId) return "";
  const url = new URL("/forum.php", props.writing.board.url);
  url.search = new URLSearchParams({
    mod: "redirect",
    goto: "findpost",
    ptid: target.threadId,
    pid: target.postId,
  }).toString();
  return url.href;
});
const action = computed(() =>
  props.writing.action === "private-message"
    ? privateWritingText("Private message", props.language)
    : props.writing.action === "edit-post"
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
    <p v-if="writing.action === 'private-message'">
      {{
        privateWritingText("To {value}", language).replace(
          "{value}",
          writing.recipient.name,
        )
      }}
      ({{ writing.recipient.id }})
    </p>
    <template v-else>
      <p>
        {{ writing.board.label }} ·
        {{ insert(text.writingBoard, writing.board.id)
        }}<template v-if="writing.replyTarget || writing.editTarget">
          ·
          {{
            insert(
              text.writingThread,
              writing.replyTarget?.threadId ??
                writing.editTarget?.threadId ??
                "",
            )
          }}</template
        >
      </p>
      <p v-if="writing.replyTarget?.postId">
        <a :href="addressedURL">{{
          review
            ? `${writing.replyTarget.author} · ${text.post} ${writing.replyTarget.postId}`
            : insert(text.addressedTo, writing.replyTarget.author).replace(
                "{post}",
                writing.replyTarget.postId,
              )
        }}</a>
      </p>
      <p v-if="writing.replyTarget?.postId && !review && !compact">
        {{ text.addressedExplanation }}
      </p>
      <p v-else-if="writing.replyTarget && !compact">
        {{ text.replyDeliveryUnknown }}
      </p>
    </template>
  </div>
</template>
