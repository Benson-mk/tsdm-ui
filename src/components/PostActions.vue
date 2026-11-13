<script setup lang="ts">
import { computed, ref, type DeepReadonly } from "vue";
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
  DropdownMenuItem,
} from "reka-ui";
import type { Workspace } from "../workspace";
import type { Post } from "../forum-client";
import { strings, insert } from "../layouts/strings";
import WorkspaceIcon from "./WorkspaceIcon.vue";
const props = defineProps<{
  workspace: Workspace;
  portal: HTMLElement;
  post: DeepReadonly<Post>;
  threadId: string;
  boardId: string | null;
  filters: readonly { url: string; label: string; authorId: string | null }[];
}>();
const text = computed(() =>
  strings(props.workspace.preferences.state.value.language),
);
const label = computed(() => insert(text.value.postActions, props.post.id));
const filter = computed(() =>
  props.filters.find(
    (f) => f.authorId !== null && f.authorId === props.post.authorId,
  ),
);
const open = ref(false);
const trigger = ref<InstanceType<typeof DropdownMenuTrigger> | null>(null);
const boundary = ref<HTMLElement | null>(null);
const outside = ref(false);
function openMenu(event: MouseEvent) {
  if (
    (event.target as Element).closest(
      'a, button, input, textarea, select, [contenteditable="true"]',
    )
  )
    return;
  event.preventDefault();
  open.value = true;
}
function reply() {
  if (!props.boardId) return;
  void props.workspace.writing.prepareReply(props.boardId, {
    threadId: props.threadId,
    postId: props.post.id,
    author: props.post.author,
    authorId: props.post.authorId,
  });
}
function emptyDoubleClick(event: MouseEvent) {
  const target = event.target;
  if (
    !(target instanceof Element) ||
    event.button !== 0 ||
    target.closest(
      'a, button, input, textarea, select, summary, [role="button"], [contenteditable], img, video, audio, iframe',
    )
  )
    return;
  // Element bounds include trailing whitespace. Inspect actual rendered text
  // rectangles so browser word selection keeps priority, including nested markup.
  const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const range = document.createRange();
    range.selectNodeContents(node);
    if (
      Array.from(range.getClientRects()).some(
        (rect) =>
          event.clientX >= rect.left &&
          event.clientX <= rect.right &&
          event.clientY >= rect.top &&
          event.clientY <= rect.bottom,
      )
    )
      return;
  }
  event.preventDefault();
  reply();
}
defineExpose({ openMenu, emptyDoubleClick });
</script>
<template>
  <DropdownMenuRoot v-model:open="open" :modal="false">
    <DropdownMenuTrigger
      ref="trigger"
      class="post-menu-trigger icon-button"
      :aria-label="label"
      :title="label"
      ><WorkspaceIcon name="more"
    /></DropdownMenuTrigger>
    <DropdownMenuPortal :to="portal">
      <div ref="boundary" class="safe-viewport-boundary" aria-hidden="true" />
      <DropdownMenuContent
        class="thread-options-menu post-options-menu"
        :aria-label="label"
        align="end"
        :side-offset="4"
        :collision-boundary="boundary"
        :collision-padding="12"
        @keydown.esc.stop="open = false"
        @interact-outside="outside = true"
        @close-auto-focus="
          (event) => {
            event.preventDefault();
            if (!outside) trigger?.$el.focus({ preventScroll: true });
            outside = false;
          }
        "
      >
        <DropdownMenuItem as-child :disabled="!boardId" @select="reply"
          ><button>{{ text.postReply }}</button></DropdownMenuItem
        >
        <DropdownMenuItem v-if="filter" as-child
          ><a :href="filter.url">{{ text.onlyPostAuthor }}</a></DropdownMenuItem
        >
        <DropdownMenuItem v-else disabled
          >{{ text.onlyPostAuthor }} ·
          {{ text.postFilterUnavailable }}</DropdownMenuItem
        >
        <DropdownMenuItem disabled
          >{{ text.postRate }} ·
          {{ text.postActionUnavailable }}</DropdownMenuItem
        >
        <DropdownMenuItem disabled
          >{{ text.postReport }} ·
          {{ text.postActionUnavailable }}</DropdownMenuItem
        >
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>
