<script setup lang="ts">
import { computed, ref, watch, nextTick, type DeepReadonly } from "vue";
import {
  DialogRoot,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
  DropdownMenuItem,
} from "reka-ui";
import type { Workspace } from "../workspace";
import type { ReadResult } from "../forum-client";
import { writeClipboardText } from "../hosts/clipboard";
import { strings } from "../layouts/strings";
import { favoriteText } from "./favorite-labels";
import WorkspaceIcon from "./WorkspaceIcon.vue";
const props = defineProps<{
  workspace: Workspace;
  portal: HTMLElement;
  thread: DeepReadonly<Extract<ReadResult, { kind: "thread" }>["thread"]>;
  filters: readonly { url: string; label: string; authorId: string | null }[];
}>();
const emit = defineEmits<{ refresh: [] }>();
const text = computed(() =>
  strings(props.workspace.preferences.state.value.language),
);
const pageOpen = ref(false),
  moreOpen = ref(false),
  fallbackOpen = ref(false);
const copied = ref(false),
  copying = ref(false),
  fallbackURL = ref("");
const fallbackField = ref<HTMLInputElement | null>(null);
const moreTrigger = ref<InstanceType<typeof DropdownMenuTrigger> | null>(null);
let outsidePress = false;
const canonicalURL = computed(() => {
  const source = new URL(props.thread.url);
  const url = new URL("/forum.php", source.origin);
  url.searchParams.set("mod", "viewthread");
  url.searchParams.set("tid", props.thread.id);
  if (/^[1-9]\d*$/.test(props.thread.pages.current))
    url.searchParams.set("page", props.thread.pages.current);
  const order = source.searchParams.get("ordertype"),
    author = source.searchParams.get("authorid");
  if (order === "0" || order === "1") url.searchParams.set("ordertype", order);
  if (author && /^[1-9]\d*$/.test(author))
    url.searchParams.set("authorid", author);
  return url.href;
});
const reverse = computed(
  () => new URL(props.thread.url).searchParams.get("ordertype") === "1",
);
watch(canonicalURL, () => {
  copied.value = false;
  pageOpen.value = false;
  moreOpen.value = false;
});
async function copyURL() {
  if (copying.value) return;
  const url = canonicalURL.value;
  copying.value = true;
  copied.value = false;
  try {
    await writeClipboardText(url);
    if (canonicalURL.value === url) copied.value = true;
  } catch {
    fallbackURL.value = url;
    fallbackOpen.value = true;
    await nextTick();
    fallbackField.value?.select();
  } finally {
    copying.value = false;
  }
}
function navigate(url: string) {
  pageOpen.value = false;
  moreOpen.value = false;
  void props.workspace.openThread(url);
}
function overlayClick() {
  if (outsidePress) {
    pageOpen.value = false;
    fallbackOpen.value = false;
  }
  outsidePress = false;
}
</script>
<template>
  <div class="reader-control-stack">
    <div
      class="reader-tool-group"
      role="group"
      :aria-label="text.pageAndOptions"
    >
      <span v-if="reverse" class="reader-order-state">{{
        text.newestFirst
      }}</span>
      <DialogRoot v-model:open="pageOpen">
        <DialogTrigger class="reader-page-trigger"
          >{{ text.page }} {{ thread.pages.current }}</DialogTrigger
        >
        <DialogPortal :to="portal">
          <DialogOverlay
            class="dialog-overlay"
            @pointerdown="
              outsidePress = $event.isPrimary && $event.button === 0
            "
            @pointercancel="outsidePress = false"
            @click="overlayClick"
          />
          <DialogContent
            class="dialog-content reader-page-dialog"
            @keydown.esc.stop="pageOpen = false"
            @pointer-down-outside.prevent
            @interact-outside.prevent
            @pointerdown="outsidePress = false"
          >
            <DialogTitle>{{ text.threadPages }}</DialogTitle>
            <DialogDescription>{{ text.supportedPages }}</DialogDescription>
            <p>{{ text.page }} {{ thread.pages.current }}</p>
            <nav :aria-label="text.threadPages">
              <a
                v-for="link in thread.pages.links"
                :key="link.url"
                :href="link.url"
                @click.prevent="navigate(link.url)"
                >{{ link.label }}</a
              >
            </nav>
            <p v-if="!thread.pages.links.length">{{ text.noPageTargets }}</p>
            <DialogClose>{{ text.close }}</DialogClose>
          </DialogContent>
        </DialogPortal>
      </DialogRoot>
      <DropdownMenuRoot v-model:open="moreOpen" :modal="false">
        <DropdownMenuTrigger
          ref="moreTrigger"
          :aria-label="text.moreThreadOptions"
          :title="text.moreThreadOptions"
          ><WorkspaceIcon name="more"
        /></DropdownMenuTrigger>
        <DropdownMenuPortal :to="portal">
          <DropdownMenuContent
            class="thread-options-menu"
            :aria-label="text.threadOptions"
            align="end"
            :side-offset="4"
            :collision-padding="12"
            @keydown.esc.stop="moreOpen = false"
          >
            <DropdownMenuItem
              v-if="workspace.state.value.canBack"
              as-child
              @select="workspace.back()"
              ><button>{{ text.backInHistory }}</button></DropdownMenuItem
            >
            <DropdownMenuItem as-child @select="emit('refresh')"
              ><button :disabled="workspace.state.value.loading">
                {{ text.refreshThread }}
              </button></DropdownMenuItem
            >
            <DropdownMenuItem
              as-child
              @select="workspace.prepareFavorite('add', 'thread', thread.id)"
              ><button :disabled="workspace.favorite.value.busy">
                {{
                  favoriteText(
                    "Save thread",
                    workspace.preferences.state.value.language,
                  )
                }}
              </button></DropdownMenuItem
            >
            <DropdownMenuItem as-child :disabled="copying" @select="copyURL"
              ><button :disabled="copying">
                {{ text.copyURL }}
              </button></DropdownMenuItem
            >
            <DropdownMenuItem
              v-for="filter in filters"
              :key="filter.url"
              as-child
              @select="navigate(filter.url)"
              ><a :href="filter.url" @click.prevent>{{
                filter.label
              }}</a></DropdownMenuItem
            >
          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenuRoot>
    </div>
    <span class="copy-url-status" role="status">{{
      copied ? text.urlCopied : copying ? text.copyingURL : ""
    }}</span>
  </div>
  <DialogRoot v-model:open="fallbackOpen">
    <DialogPortal :to="portal">
      <DialogOverlay
        class="dialog-overlay"
        @pointerdown="outsidePress = $event.isPrimary && $event.button === 0"
        @pointercancel="outsidePress = false"
        @click="overlayClick"
      />
      <DialogContent
        class="dialog-content copy-url-dialog"
        @keydown.esc.stop="fallbackOpen = false"
        @pointer-down-outside.prevent
        @interact-outside.prevent
        @pointerdown="outsidePress = false"
        @close-auto-focus.prevent="
          moreTrigger?.$el.focus({ preventScroll: true })
        "
        @open-auto-focus.prevent="
          fallbackField?.focus();
          fallbackField?.select();
        "
      >
        <DialogTitle>{{ text.copyURL }}</DialogTitle>
        <DialogDescription>{{ text.copyFailed }}</DialogDescription>
        <label
          >{{ text.threadURL
          }}<input
            ref="fallbackField"
            readonly
            :value="fallbackURL"
            @focus="fallbackField?.select()"
        /></label>
        <DialogClose>{{ text.close }}</DialogClose>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
