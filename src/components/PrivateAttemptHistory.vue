<script setup lang="ts">
import { privateWritingText } from "./private-writing-text";
import type { Workspace } from "../workspace";
import { nativeDestination } from "../hosts/browser";
const props = defineProps<{ workspace: Workspace }>();
const t = (value: string) =>
  privateWritingText(value, props.workspace.preferences.state.value.language);
</script>
<template>
  <section
    v-for="attempt in workspace.writing.state.value.context?.privateAttempts"
    :key="attempt.id"
    class="writing-attempt"
    :aria-label="
      t('Private message attempt to {value}').replace(
        '{value}',
        attempt.submission.writing.recipient.name,
      )
    "
  >
    <h2>
      {{ t("Private message") }} ·
      {{ attempt.submission.writing.account.name }} →
      {{ attempt.submission.writing.recipient.name }} ({{
        attempt.submission.writing.recipient.id
      }})
    </h2>
    <p role="status">{{ t(attempt.message) }}</p>
    <details>
      <summary>
        {{
          t("Original submitted text · revision {value}").replace(
            "{value}",
            String(attempt.submission.revision),
          )
        }}
      </summary>
      <pre class="prepared-source">{{ attempt.submission.writing.source }}</pre>
    </details>
    <button
      v-if="attempt.status === 'uncertain'"
      :disabled="
        workspace.writing.state.value.publishing ||
        workspace.writing.state.value.preparing
      "
      @click="workspace.writing.checkPrivate(attempt.id)"
    >
      {{ t("Check private message result") }}
    </button>
    <a
      :href="
        nativeDestination(
          attempt.result?.url ?? attempt.submission.writing.recipient.url,
        )
      "
      >{{ t("Open original private conversation in native forum") }}</a
    >
    <p v-if="attempt.status === 'uncertain'">
      {{
        t(
          "Checking reads the original conversation and may mark it read. No message will be resent.",
        )
      }}
    </p>
  </section>
</template>
