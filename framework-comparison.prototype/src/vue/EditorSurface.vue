<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from "vue";
import type { Harness } from "../shared/harness";
import { mountEditor } from "../shared/editor-surface";
const props = defineProps<{ harness: Harness }>();
const host = ref<HTMLElement>();
let dispose: (() => void) | undefined;
onMounted(() => {
  dispose = mountEditor(host.value!, props.harness);
});
onBeforeUnmount(() => dispose?.());
</script>
<template><div ref="host" class="editor-mount" /></template>
