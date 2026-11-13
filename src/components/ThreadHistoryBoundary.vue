<script setup lang="ts">
import { computed } from "vue";
import type { Workspace } from "../workspace";
import { strings, description } from "../layouts/strings";
const props = defineProps<{
  workspace: Workspace;
  direction: "earlier" | "later";
}>();
const history = props.workspace.threadHistory.state;
const language = computed(
  () => props.workspace.preferences.state.value.language,
);
const text = computed(() => strings(language.value));
const edge = computed(() => history.value[props.direction]);
</script>
<template>
  <div
    v-if="edge.status !== 'unloaded'"
    class="public-history-boundary"
    :data-direction="direction"
  >
    <span v-if="edge.status === 'loading'" role="status">{{
      text.historyLoading
    }}</span>
    <template v-else-if="edge.status === 'failed'">
      <button
        v-if="edge.url"
        :disabled="
          history.checking ||
          history.earlier.status === 'loading' ||
          history.later.status === 'loading'
        "
        @click="workspace.threadHistory.load(direction)"
      >
        {{ direction === "earlier" ? text.retryEarlier : text.retryLater }}
      </button>
      <p v-if="edge.failure && 'message' in edge.failure" role="status">
        {{ description(edge.failure.message, language) }}
      </p>
    </template>
    <span v-else>{{
      edge.status === "end"
        ? direction === "earlier"
          ? text.historyBeginning
          : text.historyEnd
        : direction === "earlier"
          ? text.historyEarlierUnknown
          : text.historyLaterUnknown
    }}</span>
  </div>
</template>
