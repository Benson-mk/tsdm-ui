<script setup lang="ts">
import { computed, ref } from "vue";
import {
  DialogRoot,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "reka-ui";
import ContentView from "../components/ContentView";
import type { Workspace } from "../workspace";
import { nativeDestination } from "../hosts/browser";
const props = defineProps<{ workspace: Workspace; portal: HTMLElement }>();
const state = props.workspace.state;
const aboutOpen = ref(false);
function closeAboutOnEscape(event: KeyboardEvent) {
  if (event.defaultPrevented) return;
  event.stopPropagation();
  aboutOpen.value = false;
}
const accountLabel = computed(() => {
  const account = state.value.result?.account;
  return account?.kind === "member"
    ? `Signed in as ${account.name}`
    : account?.kind === "guest"
      ? "Browsing as a guest"
      : "Account not yet confirmed";
});
</script>
<template>
  <div class="workspace">
    <header>
      <a class="brand" href="https://www.tsdm39.com/">TSDM</a
      ><span>{{ accountLabel }}</span>
      <DialogRoot v-model:open="aboutOpen"
        ><DialogTrigger>About this workspace</DialogTrigger
        ><DialogPortal :to="portal"
          ><DialogOverlay class="dialog-overlay" /><DialogContent
            class="dialog-content"
            @keydown.esc="closeAboutOnEscape"
            ><DialogTitle>About this workspace</DialogTitle
            ><DialogDescription
              >TSDM Workspace 0.1.0. Reading uses your current forum
              account.</DialogDescription
            >
            <p>
              For unsupported content or verification, continue at the same
              destination in the native forum.
            </p>
            <DialogClose>Close</DialogClose></DialogContent
          ></DialogPortal
        ></DialogRoot
      >
    </header>
    <main>
      <nav aria-label="Thread actions">
        <button @click="workspace.refresh()">Refresh thread</button
        ><a :href="nativeDestination(state.destination)"
          >Continue in native forum</a
        >
      </nav>
      <p v-if="state.loading" role="status">Loading thread…</p>
      <template v-else-if="state.result?.kind === 'thread'">
        <section class="thread-heading">
          <p class="eyebrow">THREAD {{ state.result.thread.id }}</p>
          <h1>{{ state.result.thread.title }}</h1>
        </section>
        <article
          v-for="post in state.result.thread.posts"
          :id="`pid${post.id}`"
          :key="post.id"
          :aria-label="`Post ${post.id}`"
        >
          <header>
            <strong>{{ post.author }}</strong
            ><span>Floor {{ post.floor || "unknown" }}</span
            ><time>{{ post.date }}</time
            ><a :href="post.url">Post {{ post.id }}</a>
          </header>
          <ContentView :nodes="post.content" />
        </article>
      </template>
      <section v-else-if="state.result" class="notice" role="alert">
        <h1>
          {{
            state.result.kind === "invalid"
              ? "Content unavailable"
              : state.result.kind.charAt(0).toUpperCase() +
                state.result.kind.slice(1)
          }}
        </h1>
        <p>{{ state.result.message }}</p>
      </section>
    </main>
  </div>
</template>
