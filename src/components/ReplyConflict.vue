<script setup lang="ts">
import { computed, type DeepReadonly } from "vue";
import type { ReplyRow } from "../workspace/reply-recovery";
import type { Preferences } from "../workspace/preferences";
import { strings } from "../layouts/strings";
const props = defineProps<{
  row: DeepReadonly<ReplyRow>;
  language: Preferences["language"];
}>();
const text = computed(() => strings(props.language));
</script>
<template>
  <section
    :aria-label="text.localReplyConflict"
    role="region"
    class="reply-conflict"
  >
    <p role="alert">{{ text.localReplyPaused }}</p>
    <div v-for="(variant, index) in row.variants" :key="variant.version">
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
  </section>
</template>
