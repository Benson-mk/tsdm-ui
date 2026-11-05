<script setup lang="ts">
import { computed } from "vue";
import type { Workspace } from "../workspace";
import type { PreparedWriting } from "../forum-client";
import type { DeepReadonly } from "vue";
import PreparedPublication from "./PreparedPublication.vue";
import { nativeDestination } from "../hosts/browser";
import { privateWritingText } from "./private-writing-text";
import { description } from "../layouts/strings";
const props = defineProps<{ workspace: Workspace }>();
const state = props.workspace.writing.state;
const language = computed(
  () => props.workspace.preferences.state.value.language,
);
const t = (value: string) => privateWritingText(value, language.value);
const originals = computed(() => [
  ...(state.value.context?.attempts ?? []).map((attempt) => ({
    kind: "publication" as const,
    id: attempt.id,
    status: attempt.status,
    message: attempt.message,
    publication: attempt.publication,
    packet: attempt.redPacket,
    url: attempt.result?.url ?? attempt.candidateURL,
  })),
  ...(state.value.context?.draftAttempts ?? []).map((attempt) => ({
    kind: "draft" as const,
    id: attempt.id,
    status: attempt.status,
    message: attempt.message,
    publication: {
      id: attempt.id,
      generation: attempt.generation,
      submission: attempt.submission,
    },
    packet: attempt.redPacket,
    url: attempt.publishedURL ?? attempt.result?.url,
  })),
]);
function originalURL(writing: DeepReadonly<PreparedWriting>) {
  if (writing.editTarget) return writing.editTarget.threadURL;
  if (writing.draft) return writing.draft.url;
  if (writing.replyTarget)
    return new URL(
      `/forum.php?mod=viewthread&tid=${writing.replyTarget.threadId}`,
      writing.board.url,
    ).href;
  return writing.board.url;
}
</script>
<template>
  <section
    v-for="attempt in originals"
    :key="attempt.id"
    :aria-label="
      t(
        attempt.kind === 'publication'
          ? 'Original public publication attempt'
          : 'Original forum draft attempt',
      )
    "
    class="writing-attempt"
  >
    <h2>
      {{
        t(
          attempt.kind === "publication"
            ? "Original public publication attempt"
            : "Original forum draft attempt",
        )
      }}
    </h2>
    <p role="status">{{ description(attempt.message, language) }}</p>
    <details>
      <summary>{{ t("Inspect original public writing") }}</summary>
      <PreparedPublication
        :publication="attempt.publication"
        :language="language"
      />
    </details>
    <section
      v-if="attempt.packet"
      :aria-label="description('Red-packet result', language)"
    >
      <p>
        {{ description("Packet state:", language) }}
        {{ description(attempt.packet.state, language) }}
      </p>
      <p v-for="condition in attempt.packet.conditions" :key="condition">
        {{ condition }}
      </p>
      <p>
        {{
          t(
            "Packet state and credit attribution remain separate. Ledger rows do not prove a specific debit or refund.",
          )
        }}
      </p>
      <details v-if="attempt.packet.ledger?.state === 'observed'">
        <summary>
          {{
            description(
              "Observed credit rows (current returned page only)",
              language,
            )
          }}
        </summary>
        <p v-for="(row, index) in attempt.packet.ledger.rows" :key="index">
          {{ row.operation }} · {{ row.change }} · {{ row.details }} ·
          {{ row.time }}
        </p>
      </details>
    </section>
    <button
      v-if="['uncertain', 'moderation'].includes(attempt.status)"
      :disabled="state.preparing || state.publishing"
      @click="
        attempt.kind === 'publication'
          ? workspace.writing.checkResult(attempt.id)
          : workspace.writing.checkDraft(attempt.id)
      "
    >
      {{ t("Check original public result") }}
    </button>
    <a
      :href="
        nativeDestination(
          attempt.url ?? originalURL(attempt.publication.submission.writing),
        )
      "
      >{{ t("Open original public destination in native forum") }}</a
    >
  </section>
</template>
