<script setup lang="ts">
import { computed } from "vue";
import { strings } from "../layouts/strings";
import type { Preferences } from "../workspace/preferences";

const props = defineProps<{
  loaded: boolean;
  empty: boolean;
  pending: boolean;
  failed: boolean;
  language: Preferences["language"];
}>();

const status = computed(() => {
  const text = strings(props.language);
  if (props.pending) return text.destinationListLoading;
  if (props.failed) return text.destinationListFailed;
  if (!props.loaded) return text.destinationListNotLoaded;
  return props.empty ? "" : text.destinationListLoaded;
});
</script>

<template>
  <p v-if="status" role="status">
    <span>{{ status }}</span>
    <template v-if="loaded && (pending || failed)">
      {{ " " + strings(language).destinationListPrevious }}
    </template>
  </p>
</template>
