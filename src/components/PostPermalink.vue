<script setup lang="ts">
import { computed, ref, onUnmounted } from "vue";
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "reka-ui";
import { postPermalink } from "../forum-client/post-permalink";
import type { Workspace } from "../workspace";
import { strings, insert } from "../layouts/strings";
import { writeClipboardText } from "../hosts/clipboard";
const props = defineProps<{
  workspace: Workspace;
  portal: HTMLElement;
  postId: string;
  url: string;
  threadId: string;
  threadUrl: string;
}>();
const text = computed(() =>
  strings(props.workspace.preferences.state.value.language),
);
const label = computed(() =>
  insert(text.value.copyPostPermalink, props.postId),
);
// The forum client also qualifies exact legacy links carrying referral metadata.
const permalink = computed(() =>
  postPermalink(props.url, props.threadUrl, props.threadId, props.postId),
);
const copying = ref(false),
  copied = ref(false);
const fallbackOpen = ref(false),
  fallbackURL = ref("");
const trigger = ref<HTMLButtonElement | null>(null);
const field = ref<HTMLInputElement | null>(null);
let mounted = true;
let clearStatus: ReturnType<typeof setTimeout> | undefined;
onUnmounted(() => {
  mounted = false;
  clearTimeout(clearStatus);
});
async function copy() {
  if (copying.value || !permalink.value) return;
  copying.value = true;
  copied.value = false;
  clearTimeout(clearStatus);
  const url = permalink.value;
  try {
    await writeClipboardText(url);
    if (mounted) {
      copied.value = true;
      clearStatus = setTimeout(() => {
        copied.value = false;
      }, 4000);
    }
  } catch {
    if (mounted) {
      fallbackURL.value = url;
      fallbackOpen.value = true;
    }
  } finally {
    copying.value = false;
  }
}
</script>
<template>
  <span class="post-permalink">
    <button
      ref="trigger"
      class="post-number"
      :aria-label="label"
      :title="permalink ? label : text.postPermalinkReload"
      :aria-disabled="copying || !permalink"
      @click="copy"
    >
      {{ text.post }} {{ postId }}
    </button>
    <span class="post-copy-status" role="status">{{
      copying ? text.copyingURL : copied ? text.urlCopied : ""
    }}</span>
  </span>
  <DialogRoot v-model:open="fallbackOpen">
    <DialogPortal :to="portal">
      <DialogOverlay class="dialog-overlay" />
      <DialogContent
        class="dialog-content copy-url-dialog post-permalink-dialog"
        @keydown.esc.stop="fallbackOpen = false"
        @pointer-down-outside.prevent
        @interact-outside.prevent
        @open-auto-focus.prevent="
          field?.focus();
          field?.select();
        "
        @close-auto-focus.prevent="trigger?.focus({ preventScroll: true })"
      >
        <DialogTitle>{{ label }}</DialogTitle>
        <DialogDescription>{{ text.copyFailed }}</DialogDescription>
        <label
          >{{ text.postURL
          }}<input
            ref="field"
            readonly
            :value="fallbackURL"
            @focus="field?.select()"
        /></label>
        <DialogClose>{{ text.close }}</DialogClose>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
