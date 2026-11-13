<script setup lang="ts">
// Prototype-only additions following WorkspaceIcon's stroke and sizing conventions.
const paths = {
  plus: "M12 5v14 M5 12h14",
  close: "M6 6l12 12 M6 18L18 6",
  send: "M12 19V5 M5 12l7-7 7 7",
  reply: "M9 5l-5 5 5 5 M4 10h9a7 7 0 0 1 7 7v2",
  quote: "M4 5h6v7H4z M10 12c0 4-2 6-5 7 M14 5h6v7h-6z M20 12c0 4-2 6-5 7",
  attachment:
    "M8 12l7-7a4 4 0 0 1 6 6l-9 9a6 6 0 0 1-9-9l9-9 M7 14l8-8a2 2 0 0 1 3 3l-8 8a2 2 0 0 1-3-3",
  image: "M3 3h18v18H3z M3 16l5-5 4 4 3-3 6 6 M15 7h.01",
  emoji:
    "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0 M8 9h.01 M16 9h.01 M7 14c2 4 8 4 10 0",
  format: "M4 19l6-14 6 14 M6 14h8 M18 9h4 M20 9v10",
  source: "M7 6l-5 6 5 6 M17 6l5 6-5 6 M14 3l-4 18",
  preview:
    "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12 M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
} as const;
defineProps<{ name: keyof typeof paths }>();
</script>
<template>
  <svg
    class="workspace-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.75"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path :d="paths[name]" />
  </svg>
</template>
