<script setup lang="ts">
const paths = {
  refresh:
    "M20 7v5h-5 M4 17v-5h5 M6 7a7 7 0 0 1 12-2l2 3 M18 17a7 7 0 0 1-12 2l-2-3",
  compose: "M4 20l4-1 12-12-3-3L5 16z M14 7l3 3",
  expand: "M8 3H3v5 M3 3l7 7 M16 21h5v-5 M21 21l-7-7",
  compact: "M3 8h5V3 M8 8L2 2 M21 16h-5v5 M16 16l6 6",
  more: "M5 12h.01 M12 12h.01 M19 12h.01",
  disclosure: "M6 9l6 6 6-6",
  boards: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  threads: "M8 5h13 M8 12h13 M8 19h13 M3 5h.01 M3 12h.01 M3 19h.01",
  messages: "M3 5h18v14H3z M3 5l9 7 9-7",
  search: "M21 21l-6-6 M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0",
  saved: "M6 3h12v18l-6-4-6 4z",
  notices: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21h4",
  drafts: "M14 3H4v18h16V10 M14 3v7h6 M8 14h8 M8 17h5",
  native: "M14 3h7v7 M21 3l-9 9 M10 5H3v16h16v-7",
  settings:
    "M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8 M12 2v3 M12 19v3 M2 12h3 M19 12h3 M5 5l2 2 M17 17l2 2 M5 19l2-2 M17 7l2-2",
  about: "M12 10v7 M12 7h.01 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
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
