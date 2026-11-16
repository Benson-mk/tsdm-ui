<script setup lang="ts">
const paths = {
  filter: "M3 4h18l-7 8v7l-4 2v-9z",
  page: "M14 3H5v18h14V8z M14 3v5h5 M9 12h6 M9 16h6",
  pin: "M8 3h8 M9 3v6l-4 5h14l-4-5V3 M12 14v7",
  table: "M3 3h18v18H3z M3 9h18 M9 3v18 M3 15h18 M15 9v12",
  mention:
    "M16 8v7c0 4 6 2 6-3a10 10 0 1 0-4 8 M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  attachment: "M8 13l7-7a3 3 0 0 1 4 4L9 20a5 5 0 0 1-7-7L13 2",

  visual:
    "M3 12s3-7 9-7 9 7 9 7-3 7-9 7-9-7-9-7 M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
  source: "M8 6l-6 6 6 6 M16 6l6 6-6 6 M14 3l-4 18",
  undo: "M9 4L3 9l6 5 M3 9h11a6 6 0 0 1 0 12",
  redo: "M15 4l6 5-6 5 M21 9H10a6 6 0 0 0 0 12",
  b: "M6 4h7a4 4 0 0 1 0 8H6z M6 12h8a4 4 0 0 1 0 8H6z",
  i: "M10 4h10 M4 20h10 M15 4L9 20",
  u: "M5 4v8a7 7 0 0 0 14 0V4 M4 22h16",
  s: "M18 5c-2-3-11-3-11 2 0 3 4 4 7 5 4 2 5 7-1 8-3 1-6-1-7-3 M3 12h18",
  ul: "M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01",
  ol: "M10 6h11 M10 12h11 M10 18h11 M3 3h2v6 M3 9h4 M3 14c0-3 5-3 4 0l-4 6h4",
  code: "M8 5L2 12l6 7 M16 5l6 7-6 7",

  quote: "M10 5H4v7h5c0 4-2 6-5 7 M21 5h-6v7h5c0 4-2 6-5 7",
  plus: "M12 5v14 M5 12h14",
  send: "M3 3l18 9-18 9 4-9z M7 12h14",
  review: "M9 4h10v16H5V8 M3 5l2 2 4-4 M9 12h6 M9 16h6",
  refresh:
    "M20 7v5h-5 M4 17v-5h5 M6 7a7 7 0 0 1 12-2l2 3 M18 17a7 7 0 0 1-12 2l-2-3",
  compose: "M4 20l4-1 12-12-3-3L5 16z M14 7l3 3",
  expand: "M8 3H3v5 M16 3h5v5 M3 16v5h5 M21 16v5h-5",
  compact: "M3 8h5V3 M21 8h-5V3 M8 21v-5H3 M16 21v-5h5",
  minimize: "M5 12h14",
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
    "M4 7h2 M12 7h8 M4 17h8 M18 17h2 M12 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M18 17a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
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
