<script setup lang="ts">
import { onUnmounted, ref } from "vue";
const props = defineProps<{
  label: string;
  value: number;
  minimum: number;
  maximum: number;
  reverse?: boolean;
}>();
const emit = defineEmits<{
  begin: [];
  change: [value: number];
  reset: [];
  end: [cancelled: boolean];
}>();
const edge = ref<HTMLElement | null>(null);
let drag: { id: number; x: number; value: number } | null = null;
function pointerdown(event: PointerEvent) {
  if (!event.isPrimary || event.button !== 0 || drag) return;
  event.preventDefault();
  drag = { id: event.pointerId, x: event.clientX, value: props.value };
  edge.value?.setPointerCapture(event.pointerId);
  window.addEventListener("keydown", escape, true);
  emit("begin");
}
function pointermove(event: PointerEvent) {
  if (!drag || event.pointerId !== drag.id) return;
  const delta = (event.clientX - drag.x) * (props.reverse ? -1 : 1);
  emit(
    "change",
    Math.round(
      Math.max(props.minimum, Math.min(props.maximum, drag.value + delta)),
    ),
  );
}
function finish(cancelled: boolean, event?: PointerEvent) {
  if (!drag || (event && event.pointerId !== drag.id)) return;
  const id = drag.id;
  drag = null;
  window.removeEventListener("keydown", escape, true);
  if (edge.value?.hasPointerCapture(id)) edge.value.releasePointerCapture(id);
  emit("end", cancelled);
}
function escape(event: KeyboardEvent) {
  if (event.key !== "Escape" || event.isComposing) return;
  event.preventDefault();
  event.stopPropagation();
  finish(true);
}
onUnmounted(() => finish(true));
function keydown(event: KeyboardEvent) {
  if (
    drag ||
    event.isComposing ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey
  )
    return;
  if (!["ArrowLeft", "ArrowRight", "Home"].includes(event.key)) return;
  event.preventDefault();
  emit("begin");
  if (event.key === "Home") emit("reset");
  else {
    const direction =
      (event.key === "ArrowRight" ? 1 : -1) * (props.reverse ? -1 : 1);
    emit(
      "change",
      Math.max(
        props.minimum,
        Math.min(props.maximum, props.value + direction * 10),
      ),
    );
  }
  emit("end", false);
}
</script>
<template>
  <div
    ref="edge"
    class="column-separator"
    role="separator"
    tabindex="0"
    aria-orientation="vertical"
    :aria-label="label"
    :title="label"
    :aria-valuenow="value"
    :aria-valuemin="minimum"
    :aria-valuemax="maximum"
    @keydown="keydown"
    @pointerdown="pointerdown"
    @pointermove="pointermove"
    @pointerup="finish(false, $event)"
    @pointercancel="finish(true, $event)"
    @lostpointercapture="finish(true, $event)"
  />
</template>
