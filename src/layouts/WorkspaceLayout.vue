<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
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
import { describeDestination } from "../forum-client";
import { nativeDestination } from "../hosts/browser";
const props = defineProps<{ workspace: Workspace; portal: HTMLElement }>();
const state = props.workspace.state;
const boardContext = computed(() =>
  state.value.result?.kind === "board"
    ? state.value.result.board
    : state.value.result?.kind !== "directory" &&
        state.value.origin?.kind === "board"
      ? state.value.origin.board
      : null,
);
const selectedThread = computed(() =>
  state.value.result?.kind === "thread" ? state.value.result.thread.id : null,
);
const boardChoices = computed(() =>
  state.value.result?.kind === "directory"
    ? state.value.result.directory.groups.flatMap((group) => group.boards)
    : (boardContext.value?.boards ?? []),
);
const pickerBoard = computed(() => {
  if (state.value.result?.kind === "directory") return null;
  if (boardContext.value)
    return { url: boardContext.value.url, label: boardContext.value.title };
  return state.value.result?.kind === "thread"
    ? state.value.result.thread.parent
    : null;
});
const pickerValue = computed(() =>
  state.value.result?.kind === "directory"
    ? "https://www.tsdm39.com/forum.php"
    : (pickerBoard.value?.url ?? ""),
);
function chooseBoard(event: Event) {
  const target = event.target;
  if (target instanceof HTMLSelectElement && target.value)
    void props.workspace.openThread(target.value);
}
const aboutOpen = ref(false);
const missingTarget = computed(() => {
  const result = state.value.result;
  return (
    result?.kind === "thread" &&
    result.thread.target &&
    !result.thread.posts.some((p) => p.id === result.thread.target)
  );
});
function closeAboutOnEscape(event: KeyboardEvent) {
  if (event.defaultPrevented) return;
  event.stopPropagation();
  aboutOpen.value = false;
}
function navigate(event: MouseEvent) {
  const link = event
    .composedPath()
    .find((node) => node instanceof HTMLAnchorElement);
  if (
    !(link instanceof HTMLAnchorElement) ||
    event.button !== 0 ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    event.altKey ||
    link.target ||
    link.href.includes("tsdm-native")
  )
    return;
  const route = describeDestination(link.href);
  if (!route || new URL(route.url).origin !== location.origin) return;
  event.preventDefault();
  void props.workspace.openThread(
    link.href,
    link.closest("[data-thread-id]")?.getAttribute("data-thread-id") ?? null,
  );
}
onMounted(() => {
  const root = (props.portal.getRootNode() as ShadowRoot).host as HTMLElement;
  const pane = () =>
    root.shadowRoot?.querySelector<HTMLElement>(
      `[data-scroll-pane="${state.value.result?.kind === "thread" ? "reading" : state.value.result?.kind === "board" ? "results" : "overview"}"]`,
    );
  props.workspace.setViewAdapter({
    capture() {
      const container = pane();
      const blocks =
        container?.querySelectorAll<HTMLElement>(
          "article[id], [data-thread-id]",
        ) ?? [];
      const anchor = [...blocks].find(
        (node) =>
          node.getBoundingClientRect().bottom >
          (container?.getBoundingClientRect().top ?? 0),
      );
      return {
        anchor: anchor?.id ?? null,
        offset: anchor?.getBoundingClientRect().top ?? 0,
        scrollTop: container?.scrollTop ?? root.scrollTop,
      };
    },
    restore(position, target, selection) {
      const container = pane();
      if (container) container.scrollTop = position?.scrollTop ?? 0;
      const node = target
        ? root.shadowRoot?.getElementById(`pid${target}`)
        : null;
      if (node && !position) node.scrollIntoView({ block: "start" });
      const selected = selection
        ? root.shadowRoot
            ?.getElementById(`row-${selection}`)
            ?.querySelector<HTMLElement>(".subject")
        : null;
      (node ?? selected)?.focus({ preventScroll: true });
    },
  });
});
const accountLabel = computed(() => {
  const account = state.value.result?.account;
  if (state.value.restored && account?.kind === "member")
    return `Snapshot from ${account.name}`;
  if (state.value.restored && account?.kind === "guest")
    return "Snapshot from guest browsing";
  return account?.kind === "member"
    ? `Signed in as ${account.name}`
    : account?.kind === "guest"
      ? "Browsing as a guest"
      : "Account not yet confirmed";
});
</script>
<template>
  <div class="workspace" @click="navigate">
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
              >TSDM Workspace 0.2.0. Reading uses your current forum
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
    <div class="workspace-tools">
      <nav aria-label="Thread actions">
        <a
          v-if="state.result?.kind !== 'directory'"
          class="narrow-overview-link"
          href="https://www.tsdm39.com/forum.php"
          >All boards</a
        >
        <button v-if="state.canBack" @click="workspace.back()">Back</button
        ><button @click="workspace.refresh()">
          {{
            state.destination.includes("mod=viewthread")
              ? "Refresh thread"
              : "Refresh"
          }}</button
        ><a :href="nativeDestination(state.destination)"
          >Continue in native forum</a
        >
      </nav>
      <label class="board-picker"
        >Board navigation<select
          aria-label="Board navigation"
          :value="pickerValue"
          @change="chooseBoard"
        >
          <option v-if="!pickerValue" value="" disabled>Choose a board</option>
          <option value="https://www.tsdm39.com/forum.php">All boards</option>
          <option v-if="pickerBoard" :value="pickerBoard.url">
            {{ pickerBoard.label }}
          </option>
          <option
            v-for="board in boardChoices"
            :key="board.url"
            :value="board.url"
          >
            {{ board.label }}
          </option>
        </select></label
      >
    </div>
    <div class="workspace-status">
      <p v-if="state.recoveryAvailable === false" class="recovery-note">
        Refresh recovery unavailable. This tab keeps navigation while the page
        remains open.
      </p>
      <section v-if="state.missing" role="alert">
        <p>This navigation snapshot is unavailable.</p>
        <p>
          Reload explicitly to request the destination again. If its saved
          context is unavailable, Reload opens Boards.
        </p>
        <button @click="workspace.refresh()">Reload</button>
      </section>
      <section v-if="state.documentNavigation" role="alert">
        <p>
          Return recovery could not be saved. Continue only if you accept losing
          this return snapshot.
        </p>
        <button @click="workspace.continueWithoutRecovery()">
          Continue without return recovery
        </button>
      </section>
      <p v-if="state.stale" role="status">
        {{
          state.restored
            ? "Restored snapshot — account and content have not been rechecked."
            : "Previous results are stale."
        }}
      </p>
      <p v-if="state.loading" role="status">Loading…</p>
      <p
        v-if="
          state.failure &&
          state.result !== state.failure &&
          'message' in state.failure
        "
        role="alert"
      >
        {{ state.failure.message }}
      </p>
    </div>
    <main
      class="workspace-body"
      :data-view="state.result?.kind ?? 'unavailable'"
    >
      <nav aria-label="Main destinations" class="main-destinations">
        <a href="https://www.tsdm39.com/forum.php" aria-current="page"
          >Boards</a
        >
      </nav>
      <nav aria-label="Boards navigation" class="boards-navigation pane">
        <h2>Browse boards</h2>
        <a href="https://www.tsdm39.com/forum.php">All boards</a
        ><a v-if="boardContext" :href="boardContext.url">{{
          boardContext.title
        }}</a
        ><a
          v-else-if="
            state.result?.kind === 'thread' && state.result.thread.parent
          "
          :href="state.result.thread.parent.url"
          >{{ state.result.thread.parent.label }}</a
        ><a v-for="board in boardChoices" :key="board.url" :href="board.url">{{
          board.label
        }}</a>
      </nav>
      <section
        v-if="state.result?.kind === 'directory'"
        class="overview pane"
        data-scroll-pane="overview"
        aria-label="Boards overview"
      >
        <h1>Boards</h1>
        <p>Choose a board to read its threads.</p>
        <section
          v-for="group in state.result.directory.groups"
          :key="group.title"
          class="board-group"
        >
          <h2>{{ group.title }}</h2>
          <div class="board-grid">
            <a
              v-for="board in group.boards"
              :key="board.url"
              :href="board.url"
              :aria-label="board.label"
              class="board-card"
              ><strong>{{ board.label }}</strong
              ><span>{{ board.description }}</span
              ><small>{{ board.stats }}</small></a
            >
          </div>
        </section>
        <nav aria-label="Directory pages">
          <a
            v-for="link in state.result.directory.pages.links"
            :key="link.url"
            :href="link.url"
            >{{ link.label }}</a
          >
        </nav>
      </section>
      <section
        v-if="boardContext"
        class="results-pane pane"
        :class="{ 'secondary-results': state.result?.kind === 'thread' }"
        data-scroll-pane="results"
        aria-label="Thread results"
      >
        <h1>{{ boardContext.title }}</h1>
        <section v-if="boardContext.boards.length">
          <h2>Subordinate boards</h2>
          <div class="board-grid">
            <a
              v-for="board in boardContext.boards"
              :key="board.url"
              :href="board.url"
              :aria-label="board.label"
              class="board-card"
              >{{ board.label }}</a
            >
          </div>
        </section>
        <nav aria-label="Board filters">
          <a
            v-for="filter in boardContext.filters"
            :key="filter.url"
            :href="filter.url"
            >{{ filter.label }}</a
          >
        </nav>
        <ul aria-label="Effective criteria">
          <li v-for="criterion in boardContext.criteria" :key="criterion.label">
            {{ criterion.label }}
          </li>
        </ul>
        <p>Page {{ boardContext.pages.current }}</p>
        <div
          v-for="row in boardContext.threads"
          :id="`row-${row.rowId}`"
          :key="row.rowId"
          class="thread-row"
          :data-thread-id="row.id"
        >
          <span v-if="row.pinned">Pinned</span
          ><span v-if="row.moved">Moved</span><span>{{ row.category }}</span
          ><a
            :href="row.url"
            class="subject"
            :aria-current="
              (state.selection ?? selectedThread) === row.id
                ? 'true'
                : undefined
            "
            >{{ row.label }}</a
          ><span>{{ row.author }}</span
          ><time>{{ row.date }}</time
          ><span>{{ row.replies }} replies · {{ row.views }} views</span
          ><a v-if="row.lastPost" :href="row.lastPost.url"
            >Last reply to {{ row.label }}</a
          >
        </div>
        <p v-if="!boardContext.threads.length">{{ boardContext.empty }}</p>
        <nav aria-label="Board pages">
          <a
            v-for="link in boardContext.pages.links"
            :key="link.url"
            :href="link.url"
            >{{ link.label }}</a
          >
        </nav>
      </section>
      <section
        v-if="state.result?.kind === 'thread'"
        class="reading-pane pane"
        data-scroll-pane="reading"
        aria-label="Thread reading"
      >
        <section class="thread-heading">
          <p class="eyebrow">THREAD {{ state.result.thread.id }}</p>
          <h1>{{ state.result.thread.title }}</h1>
          <p>Page {{ state.result.thread.pages.current }}</p>
          <a
            v-if="state.result.thread.parent"
            :href="state.result.thread.parent.url"
            >{{ state.result.thread.parent.label }}</a
          >
        </section>
        <nav aria-label="Thread filters">
          <a
            v-for="filter in state.result.thread.filters"
            :key="filter.url"
            :href="filter.url"
            >{{ filter.label }}</a
          >
        </nav>
        <p v-if="missingTarget" role="alert">
          Requested post {{ state.result.thread.target }} is missing from this
          page.
        </p>
        <p
          v-for="notice in state.result.thread.notices"
          :key="notice"
          class="permission-notice"
        >
          {{ notice }}
        </p>
        <article
          v-for="post in state.result.thread.posts"
          :id="`pid${post.id}`"
          :key="post.id"
          :aria-label="`Post ${post.id}`"
          :data-targeted="state.result.thread.target === post.id"
          tabindex="-1"
        >
          <header>
            <strong>{{ post.author }}</strong
            ><span>Floor {{ post.floor || "unknown" }}</span
            ><time>{{ post.date }}</time
            ><a :href="post.url">Post {{ post.id }}</a>
          </header>
          <ContentView :nodes="post.content" />
        </article>
        <nav aria-label="Pages">
          <a
            v-for="link in state.result.thread.pages.links"
            :key="link.url"
            :href="link.url"
            >{{ link.label }}</a
          >
        </nav>
      </section>
      <section
        v-if="
          state.result &&
          !['directory', 'board', 'thread'].includes(state.result.kind)
        "
        class="notice pane"
        role="alert"
      >
        <h1>
          {{
            state.result.kind === "invalid"
              ? "Content unavailable"
              : state.result.kind.charAt(0).toUpperCase() +
                state.result.kind.slice(1)
          }}
        </h1>
        <p>{{ "message" in state.result ? state.result.message : "" }}</p>
      </section>
      <section
        v-if="state.result?.kind === 'board'"
        class="board-overview pane"
      >
        <h2>Choose a thread</h2>
        <p>
          Read complete posts, follow exact replies, and return to this result
          page.
        </p>
      </section>
    </main>
  </div>
</template>
