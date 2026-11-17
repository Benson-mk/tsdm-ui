<script setup lang="ts">
// Throwaway: imported only from the development preview entry.
import { onMounted, onUnmounted } from "vue";
const props = defineProps<{
  current: string;
  variants: { key: string; name: string }[];
  summary: string;
}>();
const emit = defineEmits<{ change: [value: string]; inspect: [] }>();
const development = import.meta.env.DEV;
function cycle(delta: number) {
  const next =
    props.variants[
      (props.variants.findIndex((v) => v.key === props.current) +
        delta +
        props.variants.length) %
        props.variants.length
    ]!;
  emit("change", next.key);
}
function keydown(event: KeyboardEvent) {
  if (
    event.defaultPrevented ||
    event.isComposing ||
    event.altKey ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey
  )
    return;
  if (
    event
      .composedPath()
      .some(
        (node) =>
          node instanceof HTMLElement &&
          node.matches(
            'input, textarea, select, [contenteditable], [role="slider"], [role="dialog"], [role="menu"], [role="toolbar"]',
          ),
      )
  )
    return;
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    event.preventDefault();
    cycle(event.key === "ArrowLeft" ? -1 : 1);
  }
}
onMounted(() => {
  if (development) window.addEventListener("keydown", keydown);
});
onUnmounted(() => window.removeEventListener("keydown", keydown));
</script>
<template>
  <aside
    v-if="development"
    class="prototype-switcher"
    aria-label="Prototype variants"
  >
    <button aria-label="Previous variant" @click="cycle(-1)">←</button>
    <div aria-live="polite">
      <small>THROWAWAY PROTOTYPE</small
      ><strong
        >{{ current }} ·
        {{ variants.find((v) => v.key === current)?.name }}</strong
      ><span>{{ summary }}</span>
    </div>
    <button aria-label="Next variant" @click="cycle(1)">→</button>
    <button
      class="prototype-inspect-button"
      aria-label="Inspect prototype state and scenarios"
      @click="emit('inspect')"
    >
      Inspect
    </button>
  </aside>
</template>
