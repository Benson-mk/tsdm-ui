<script setup lang="ts">
import { computed, ref, nextTick, type DeepReadonly } from "vue";
import { hasUnsettledReply, type ReplyRow } from "../workspace/reply-recovery";
import type { Preferences } from "../workspace/preferences";
import { strings } from "../layouts/strings";
const props = defineProps<{
  row: DeepReadonly<ReplyRow>;
  language: Preferences["language"];
  alternatives?: boolean;
  busy?: boolean;
}>();
const emit = defineEmits<{
  choose: [row: DeepReadonly<ReplyRow>, version: string];
  discard: [row: ReplyRow, version: string];
}>();
const region = ref<HTMLElement | null>(null);
const confirmation = ref<{ row: ReplyRow; version: string } | null>(null);
async function cancelDiscard() {
  const version = confirmation.value?.version;
  confirmation.value = null;
  await nextTick();
  region.value
    ?.querySelector<HTMLButtonElement>(`[data-discard-version="${version}"]`)
    ?.focus();
}
function confirmDiscard() {
  const captured = confirmation.value;
  confirmation.value = null;
  if (captured) emit("discard", captured.row, captured.version);
}
const versions = computed(() =>
  props.alternatives ? (props.row.retained ?? []) : props.row.variants,
);
const text = computed(() => strings(props.language));
</script>
<template>
  <section
    ref="region"
    :aria-label="
      alternatives ? text.localReplyAlternatives : text.localReplyConflict
    "
    role="region"
    class="reply-conflict"
  >
    <p v-if="!alternatives" role="alert">{{ text.localReplyPaused }}</p>
    <p>{{ text.localReplyChoiceDisclosure }}</p>
    <div v-for="(variant, index) in versions" :key="variant.version">
      <p>
        {{ text.localReplyVersion.replace("{value}", String(index + 1)) }} ·
        {{ row.threadId
        }}<template v-if="variant.context?.replyTarget?.postId">
          / #{{ variant.context.replyTarget.postId }}</template
        >
      </p>
      <textarea
        readonly
        :aria-label="
          text.localReplyVersion.replace('{value}', String(index + 1))
        "
        :value="variant.context?.source ?? text.localReplyRemoved"
        rows="4"
      />
      <button :disabled="busy" @click="emit('choose', row, variant.version)">
        {{
          variant.context
            ? text.localReplyContinue.replace("{value}", String(index + 1))
            : text.localReplyContinueEmpty
        }}
      </button>
      <button
        v-if="alternatives"
        :data-discard-version="variant.version"
        :disabled="busy || hasUnsettledReply(variant.context)"
        @click="
          confirmation = {
            row: JSON.parse(JSON.stringify(row)),
            version: variant.version,
          }
        "
      >
        {{ text.localReplyDiscard.replace("{value}", String(index + 1)) }}
      </button>
      <p v-if="hasUnsettledReply(variant.context)">
        {{ text.localReplyUnsettledVersion }}
      </p>
      <details>
        <summary>{{ text.localReplyDetails }}</summary>
        <textarea
          readonly
          :aria-label="text.localReplyDetails"
          :value="JSON.stringify(variant.context, null, 2)"
          rows="6"
        />
      </details>
    </div>
    <div
      v-if="confirmation"
      role="group"
      :aria-label="text.localReplyDiscardConfirm"
    >
      <p>{{ text.localReplyDiscardWarning }}</p>
      <textarea
        readonly
        :aria-label="text.localReplyDiscardSource"
        :value="
          confirmation.row.retained?.find(
            (item) => item.version === confirmation!.version,
          )?.context?.source ?? text.localReplyRemoved
        "
        rows="4"
      />
      <button :disabled="busy" @click="confirmDiscard">
        {{ text.localReplyDiscardConfirm }}
      </button>
      <button @click="cancelDiscard">{{ text.localReplyKeep }}</button>
    </div>
  </section>
</template>
