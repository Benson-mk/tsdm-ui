<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch, nextTick } from "vue";
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
import SearchView from "../components/SearchView.vue";
import { favoriteText } from "../components/favorite-labels";
import FavoritesView from "../components/FavoritesView.vue";
import NoticesView from "../components/NoticesView.vue";
import SourceWriting from "../components/SourceWriting.vue";
import ContentView from "../components/ContentView";
import SettingsDialog from "../components/SettingsDialog.vue";
import type { Workspace } from "../workspace";
import { describeDestination } from "../forum-client";
import { nativeDestination } from "../hosts/browser";
import { strings, insert, description } from "./strings";
import type { Section } from "../workspace/navigation";
const props = defineProps<{ workspace: Workspace; portal: HTMLElement }>();
const state = props.workspace.state;
const text = computed(() =>
  strings(props.workspace.preferences.state.value.language),
);
const sections: Section[] = ["boards", "search", "saved", "notices", "drafts"];
const sectionInfo = computed(() => {
  const section = state.value.section;
  if (
    section === "boards" ||
    section === "search" ||
    section === "notices" ||
    section === "saved"
  )
    return null;
  return {
    title: text.value[section],
    heading: text.value[`${section}Heading`],
    description: text.value[`${section}Overview`],
    secondary: [text.value.draftsScope],
    nativeURL:
      "https://www.tsdm39.com/home.php?mod=space&do=thread&view=me&type=thread&filter=save",
  };
});
function chooseSection(event: Event) {
  if (
    event.target instanceof HTMLSelectElement &&
    sections.includes(event.target.value as Section)
  )
    void props.workspace.openSection(event.target.value as Section);
}
type PanePosition = {
  pane: HTMLElement;
  anchor: HTMLElement;
  offset: number;
  paneTop: number;
};
let viewportPositions: PanePosition[] = [];
type RestoredAnchor = Pick<PanePosition, "pane" | "anchor"> & {
  scrollTop: number;
};
let appearanceAnchors: RestoredAnchor[] = [];
let viewportWidth = window.innerWidth;
let viewportHeight = window.innerHeight;
const workspaceHost = () =>
  (props.portal.getRootNode() as ShadowRoot).host as HTMLElement;
function capturePositions(retained: RestoredAnchor[] = []): PanePosition[] {
  return [
    ...(workspaceHost().shadowRoot?.querySelectorAll<HTMLElement>(".pane") ??
      []),
  ].flatMap((pane) => {
    if (!pane.getClientRects().length) return [];
    const bounds = pane.getBoundingClientRect();
    const previous = retained.find(
      (position) =>
        position.pane === pane &&
        position.anchor.isConnected &&
        position.scrollTop === pane.scrollTop,
    );
    const anchor =
      previous?.anchor ??
      [
        ...pane.querySelectorAll<HTMLElement>(
          ".post-content p, .post-content pre, .post-content .table-overflow, .post-content summary, .thread-row, .board-card, .board-group > h2, .thread-heading",
        ),
      ].find(
        (node) =>
          node.getBoundingClientRect().bottom > bounds.top + 1 &&
          node.getBoundingClientRect().top < bounds.bottom,
      );
    return anchor
      ? [
          {
            pane,
            anchor,
            offset: anchor.getBoundingClientRect().top,
            paneTop: bounds.top,
          },
        ]
      : [];
  });
}
function rememberPositions() {
  if (
    window.innerWidth !== viewportWidth ||
    window.innerHeight !== viewportHeight
  )
    return;
  const current = capturePositions();
  viewportPositions = [
    ...viewportPositions.filter(
      ({ pane }) =>
        pane.isConnected && !current.some((position) => position.pane === pane),
    ),
    ...current,
  ];
}
function restorePositions(positions: PanePosition[], relativeToPane = false) {
  for (const { pane, anchor, offset, paneTop } of positions)
    if (anchor.isConnected && pane.getClientRects().length)
      pane.scrollTop +=
        anchor.getBoundingClientRect().top -
        offset -
        (relativeToPane ? pane.getBoundingClientRect().top - paneTop : 0);
}
function resize() {
  restorePositions(viewportPositions, true);
  viewportWidth = window.innerWidth;
  viewportHeight = window.innerHeight;
  rememberPositions();
}
watch(() => [state.value.result, state.value.section], rememberPositions, {
  flush: "post",
});
onMounted(() => {
  rememberPositions();
  workspaceHost().shadowRoot!.addEventListener(
    "scroll",
    rememberPositions,
    true,
  );
  window.addEventListener("resize", resize);
});
onUnmounted(() => {
  workspaceHost().shadowRoot!.removeEventListener(
    "scroll",
    rememberPositions,
    true,
  );
  window.removeEventListener("resize", resize);
});
watch(
  props.workspace.preferences.state,
  () => {
    const host = workspaceHost();
    // Keep the same block across repeated reflows until the reader scrolls.
    // A shorter toolbar can expose the preceding block without user movement.
    const positions = capturePositions(appearanceAnchors);
    host.style.setProperty(
      "--text-scale",
      String(props.workspace.preferences.state.value.textSize / 100),
    );
    host.dataset.theme = props.workspace.preferences.state.value.theme;
    host.dataset.spacing =
      props.workspace.preferences.state.value.textSize < 100
        ? "compact"
        : "default";
    host.lang = props.workspace.preferences.state.value.language;
    void nextTick().then(() => {
      restorePositions(positions);
      appearanceAnchors = positions.map(({ pane, anchor }) => ({
        pane,
        anchor,
        scrollTop: pane.scrollTop,
      }));
      rememberPositions();
    });
  },
  { immediate: true, flush: "sync" },
);
const favorite = props.workspace.favorite;
const favoriteLabel = (value: string) =>
  favoriteText(value, props.workspace.preferences.state.value.language);
const download = props.workspace.download;
watch(download, async (value) => {
  if (value?.status !== "ready" && value?.status !== "failure") return;
  await nextTick();
  const root = props.portal.getRootNode();
  if (root instanceof ShadowRoot)
    root
      .querySelector("[data-download-status]")
      ?.scrollIntoView({ block: "nearest" });
});
const writing = props.workspace.writing.state;
function prepareWriting(redPacket = false) {
  const url = pickerBoard.value?.url;
  const id = url && new URL(url).searchParams.get("fid");
  if (id) void props.workspace.writing.prepare(id, false, undefined, redPacket);
}
const boardContext = computed(() =>
  !["boards", "saved"].includes(state.value.section)
    ? null
    : state.value.result?.kind === "board"
      ? state.value.result.board
      : state.value.result?.kind !== "directory" &&
          state.value.origin?.kind === "board"
        ? state.value.origin.board
        : null,
);
const searchContext = computed(() =>
  state.value.section !== "search"
    ? null
    : state.value.result?.kind === "search"
      ? state.value.result.search
      : state.value.result?.kind === "thread" &&
          state.value.origin?.kind === "search"
        ? state.value.origin.search
        : null,
);

const favoriteContext = computed(() =>
  state.value.section !== "saved"
    ? null
    : state.value.result?.kind === "favorites"
      ? state.value.result.favorites
      : state.value.origin?.kind === "favorites"
        ? state.value.origin.favorites
        : null,
);
const selectedThread = computed(() =>
  state.value.result?.kind === "thread" ? state.value.result.thread.id : null,
);
const noticeContext = computed(() =>
  state.value.section !== "notices"
    ? null
    : state.value.result?.kind === "notices"
      ? state.value.result.notices
      : state.value.origin?.kind === "notices"
        ? state.value.origin.notices
        : null,
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
function chooseNoticeCategory(event: Event) {
  const target = event.target;
  if (target instanceof HTMLSelectElement && target.value)
    void props.workspace.loadNotices(target.value);
}
const aboutOpen = ref(false);
function changeAboutOpen(value: boolean) {
  const change = () => {
    aboutOpen.value = value;
  };
  if (!props.workspace.writing.deferViewChange(change)) change();
}
const inspectRecovery = ref(false),
  confirmReset = ref(false);
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
  const current = state.value.result;
  if (current?.kind === "thread") {
    const post = current.thread.posts.find(
      (item) => `pid${item.id}` === link.closest("article")?.id,
    );
    const attachment = post?.attachments?.find(
      (item) => item.url === link.href,
    );
    if (post && attachment) {
      event.preventDefault();
      void props.workspace.prepareDownload(post.id, attachment.id);
      return;
    }
  }
  const route = describeDestination(link.href);
  if (!route || new URL(route.url).origin !== location.origin) return;
  event.preventDefault();
  void props.workspace.openThread(
    link.href,
    link.closest("[data-favorite-id]")?.getAttribute("data-favorite-id") ??
      link.closest("[data-notice-id]")?.getAttribute("data-notice-id") ??
      link.closest("[data-thread-id]")?.getAttribute("data-thread-id") ??
      null,
  );
}
let stopReadingImageRestore: (() => void) | undefined;
function followPendingReadingImages(
  container: HTMLElement,
  target: HTMLElement,
  savedScrollTop: number | null,
) {
  const pending = new Set(
    [...container.querySelectorAll<HTMLImageElement>("img")].filter(
      (image) =>
        !image.complete &&
        !!(
          target.compareDocumentPosition(image) &
          Node.DOCUMENT_POSITION_PRECEDING
        ),
    ),
  );
  if (!pending.size) return;
  let expectedScrollTop = container.scrollTop;
  const inputEvents = ["wheel", "touchstart", "pointerdown", "keydown"];
  const stop = () => {
    container.removeEventListener("load", settled, true);
    container.removeEventListener("error", settled, true);
    container.removeEventListener("scroll", scrolled);
    for (const event of inputEvents) container.removeEventListener(event, stop);
    if (stopReadingImageRestore === stop) stopReadingImageRestore = undefined;
  };
  const scrolled = () => {
    if (container.scrollTop !== expectedScrollTop) stop();
  };
  const settled = (event: Event) => {
    if (
      !(event.target instanceof HTMLImageElement) ||
      !pending.delete(event.target)
    )
      return;
    if (!target.isConnected) return stop();
    if (savedScrollTop !== null) container.scrollTop = savedScrollTop;
    else target.scrollIntoView({ block: "start" });
    expectedScrollTop = container.scrollTop;
    if (!pending.size) stop();
  };
  // Late intrinsic image sizes can invalidate the initial target positioning.
  // Stop when these images settle or the reader expresses a new scroll intent.
  container.addEventListener("load", settled, true);
  container.addEventListener("error", settled, true);
  container.addEventListener("scroll", scrolled);
  for (const event of inputEvents)
    container.addEventListener(event, stop, { passive: true });
  stopReadingImageRestore = stop;
}
watch(
  [
    () => state.value.key,
    () => state.value.section,
    () => state.value.result,
    () => writing.value.visible,
  ],
  () => stopReadingImageRestore?.(),
  { flush: "sync" },
);
onUnmounted(() => stopReadingImageRestore?.());
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
      stopReadingImageRestore?.();
      if (writing.value.visible) return;
      const container = pane();
      if (container) container.scrollTop = position?.scrollTop ?? 0;
      const node = target
        ? root.shadowRoot?.getElementById(`pid${target}`)
        : null;
      if (node && !position) node.scrollIntoView({ block: "start" });
      if (
        !position &&
        !state.value.loading &&
        state.value.result?.kind === "search" &&
        state.value.result.search.results
      )
        container
          ?.querySelector<HTMLElement>(".search-results h2")
          ?.scrollIntoView({ block: "start" });
      const selected = selection
        ? (root.shadowRoot?.getElementById(`favorite-${selection}`) ??
          root.shadowRoot?.getElementById(`notice-${selection}`) ??
          root.shadowRoot
            ?.getElementById(`row-${selection}`)
            ?.querySelector<HTMLElement>(".subject"))
        : null;
      (node ?? selected)?.focus({ preventScroll: true });
      if (container && node)
        followPendingReadingImages(
          container,
          node,
          position?.scrollTop ?? null,
        );
    },
  });
});
const accountLabel = computed(() => {
  const account = state.value.result?.account;
  if (state.value.restored && account?.kind === "member")
    return insert(text.value.snapshotMember, account.name);
  if (state.value.restored && account?.kind === "guest")
    return text.value.snapshotGuest;
  return account?.kind === "member"
    ? insert(text.value.signedIn, account.name)
    : account?.kind === "guest"
      ? text.value.guest
      : text.value.accountUnknown;
});
function boardIdFrom(url: string) {
  return new URL(url).searchParams.get("fid") ?? "";
}
</script>
<template>
  <div class="workspace" @click="navigate">
    <header>
      <a class="brand" href="https://www.tsdm39.com/">TSDM</a
      ><span>{{ accountLabel }}</span>
      <SettingsDialog :workspace="workspace" :portal="portal" />
      <DialogRoot :open="aboutOpen" @update:open="changeAboutOpen"
        ><DialogTrigger>{{ text.about }}</DialogTrigger
        ><DialogPortal :to="portal"
          ><DialogOverlay class="dialog-overlay" /><DialogContent
            class="dialog-content"
            @keydown.esc="closeAboutOnEscape"
            ><DialogTitle>{{ text.about }}</DialogTitle
            ><DialogDescription>{{ text.aboutDescription }}</DialogDescription>
            <p>
              {{ text.nativeHelp }}
            </p>
            <DialogClose>{{ text.close }}</DialogClose></DialogContent
          ></DialogPortal
        ></DialogRoot
      >
    </header>
    <div class="workspace-tools">
      <nav :aria-label="text.actions">
        <a
          v-if="state.result?.kind !== 'directory'"
          class="narrow-overview-link"
          href="https://www.tsdm39.com/forum.php"
          >{{ text.allBoards }}</a
        >
        <a
          v-if="state.section === 'search'"
          class="narrow-overview-link search-new-link"
          href="https://www.tsdm39.com/search.php?mod=forum&adv=yes"
          >{{ text.newSearch }}</a
        >
        <button v-if="state.canBack" @click="workspace.back()">
          {{ text.back }}</button
        ><button
          v-if="
            state.result?.kind === 'search' && state.result.search.effective
          "
          @click="workspace.submitSearch(true)"
        >
          {{ text.rerunSearch }}</button
        ><button v-else @click="workspace.refresh()">
          {{
            state.destination.includes("mod=viewthread")
              ? text.refreshThread
              : text.refresh
          }}</button
        ><a
          :href="nativeDestination(sectionInfo?.nativeURL ?? state.destination)"
          >{{ text.native }}</a
        >
      </nav>
      <label v-if="state.section === 'boards'" class="board-picker"
        >{{ text.boardNavigation
        }}<select
          :aria-label="text.boardNavigation"
          :value="pickerValue"
          @change="chooseBoard"
        >
          <option v-if="!pickerValue" value="" disabled>
            {{ text.chooseBoard }}
          </option>
          <option value="https://www.tsdm39.com/forum.php">
            {{ text.allBoards }}
          </option>
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
      <label
        v-if="state.section === 'notices' && noticeContext"
        class="board-picker"
        >{{ text.noticeCategories
        }}<select
          :aria-label="text.noticeCategories"
          :value="
            noticeContext.categories.find((category) => category.current)
              ?.url ?? ''
          "
          :disabled="state.loading"
          @change="chooseNoticeCategory"
        >
          <option value="" disabled>{{ text.noticeCategories }}</option>
          <option
            v-for="category in noticeContext.categories"
            :key="category.url"
            :value="category.url"
          >
            {{ category.label }}
          </option>
        </select></label
      >
      <label v-else-if="state.section !== 'boards'" class="board-picker"
        >{{ text.sectionNavigation
        }}<select
          :aria-label="text.sectionNavigation"
          :value="state.section"
          @change="chooseSection"
        >
          <option v-for="section in sections" :key="section" :value="section">
            {{ text[section] }}
          </option>
        </select></label
      >
      <label class="narrow-section-picker"
        >{{ text.mainDestinations
        }}<select
          :aria-label="text.mainDestinations"
          :value="state.section"
          @change="chooseSection"
        >
          <option v-for="section in sections" :key="section" :value="section">
            {{ text[section] }}
          </option>
        </select></label
      >
    </div>
    <div class="writing-actions">
      <button
        v-if="pickerBoard"
        :disabled="writing.preparing"
        @click="prepareWriting()"
      >
        {{ text.newThread }}
      </button>
      <button
        v-if="pickerBoard"
        :disabled="writing.preparing"
        @click="prepareWriting(true)"
      >
        {{
          description(
            "New red packet",
            workspace.preferences.state.value.language,
          )
        }}
      </button>
      <button
        v-if="state.result?.kind === 'thread' || state.result?.kind === 'board'"
        :disabled="favorite.busy"
        @click="
          workspace.prepareFavorite(
            'add',
            state.result.kind === 'board' ? 'forum' : 'thread',
            state.result.kind === 'board'
              ? state.result.board.id
              : state.result.thread.id,
          )
        "
      >
        {{
          favoriteLabel(
            state.result.kind === "board" ? "Save board" : "Save thread",
          )
        }}
      </button>
      <button v-if="writing.context" @click="workspace.writing.show()">
        {{ text.returnWriting }}
      </button>
      <p v-if="writing.preparing" role="status">{{ text.preparingForm }}</p>
      <p v-if="writing.message" role="alert">
        {{
          description(
            writing.message,
            workspace.preferences.state.value.language,
          )
        }}
      </p>
      <section v-if="writing.editReplacement" role="alert">
        <p>{{ text.replaceEditWarning }}</p>
        <button @click="workspace.writing.cancelEditReplacement()">
          {{ text.keepCurrentWriting }}
        </button>
        <button @click="workspace.writing.replaceWithEdit()">
          {{ text.discardAndEdit }}
        </button>
        <button
          v-if="writing.context?.draftSaveAvailable"
          :disabled="writing.preparing || writing.publishing"
          @click="workspace.writing.saveDraft(true)"
        >
          {{ text.saveDraftContinue }}
        </button>
      </section>
      <section
        v-if="writing.replacement || writing.draftReplacement"
        role="alert"
      >
        <p>{{ text.replaceWritingWarning }}</p>
        <button @click="workspace.writing.show()">
          {{ text.returnOriginal }}</button
        ><button
          :disabled="writing.preparing"
          @click="workspace.writing.discardAndPrepare()"
        >
          {{
            writing.draftReplacement
              ? text.discardResumeDraft
              : text.discardPrepare
          }}
        </button>
        <button
          v-if="writing.context?.draftSaveAvailable"
          :disabled="writing.preparing || writing.publishing"
          @click="workspace.writing.saveDraft(true)"
        >
          {{ text.saveDraftContinue }}
        </button>
      </section>
    </div>
    <SourceWriting v-if="writing.visible" :workspace="workspace" />
    <div class="workspace-status">
      <section
        v-if="state.recoveryProblem?.kind === 'incompatible'"
        role="alert"
      >
        <p>{{ text.incompatibleRecovery }}</p>
        <button @click="inspectRecovery = !inspectRecovery">
          {{ text.inspectRecovery }}
        </button>
        <label v-if="inspectRecovery"
          >{{ text.retainedRecovery
          }}<textarea
            :aria-label="text.retainedRecovery"
            readonly
            :value="state.recoveryProblem.raw ?? ''"
          />
        </label>
        <button @click="confirmReset = true">{{ text.resetRecovery }}</button>
        <section v-if="confirmReset">
          <p>{{ text.discardRecoveryWarning }}</p>
          <button @click="confirmReset = false">{{ text.keepRecovery }}</button
          ><button
            @click="
              workspace.resetRecovery();
              confirmReset = false;
              inspectRecovery = false;
            "
          >
            {{ text.discardRecovery }}
          </button>
        </section>
      </section>
      <p v-if="state.recoveryProblem?.kind === 'refused'" role="alert">
        {{ text.readRecoveryRefused }}
      </p>
      <p v-if="state.recoveryAvailable === false" class="recovery-note">
        {{ text.recoveryUnavailable }}
      </p>
      <section v-if="state.missing" role="alert">
        <p>{{ text.snapshotUnavailable }}</p>
        <p v-if="download?.status === 'failure'">
          {{
            description(
              download.message,
              workspace.preferences.state.value.language,
            )
          }}
        </p>
        <p>
          {{ text.snapshotReload }}
        </p>
        <p>{{ text.missingSearch }}</p>
        <p v-if="state.section === 'notices'">{{ text.noticeEffects }}</p>
        <button @click="workspace.refresh()">{{ text.reload }}</button>
      </section>
      <section v-if="state.documentNavigation" role="alert">
        <p>
          {{ text.returnUnavailable }}
        </p>
        <button @click="workspace.continueWithoutRecovery()">
          {{ text.continueWithoutRecovery }}
        </button>
      </section>
      <p v-if="state.stale" role="status">
        {{ state.restored ? text.restored : text.stale }}
      </p>
      <p v-if="state.loading" role="status">{{ text.loading }}</p>
      <p
        v-if="
          state.failure &&
          state.result !== state.failure &&
          'message' in state.failure
        "
        role="alert"
      >
        {{
          description(
            state.failure.message,
            workspace.preferences.state.value.language,
            "nativeText" in state.failure
              ? state.failure.nativeText
              : undefined,
          )
        }}
      </p>
      <section
        v-if="
          ['boards', 'search', 'notices', 'saved'].includes(state.section) &&
          state.result &&
          ![
            'directory',
            'board',
            'thread',
            'search',
            'notices',
            'favorites',
          ].includes(state.result.kind)
        "
        class="notice"
        role="alert"
      >
        <h1>
          {{
            state.result.kind === "invalid"
              ? text.contentUnavailable
              : description(
                  state.result.kind.charAt(0).toUpperCase() +
                    state.result.kind.slice(1),
                  workspace.preferences.state.value.language,
                )
          }}
        </h1>
        <p>
          {{
            "message" in state.result
              ? description(
                  state.result.message,
                  workspace.preferences.state.value.language,
                  "nativeText" in state.result
                    ? state.result.nativeText
                    : undefined,
                )
              : ""
          }}
        </p>
      </section>
    </div>
    <section
      v-if="favorite.message"
      class="notice favorite-action"
      :aria-label="favoriteLabel('Favorite action')"
    >
      <p role="status">{{ favoriteLabel(favorite.message) }}</p>
      <button
        v-if="favorite.prepared"
        :disabled="favorite.busy"
        @click="workspace.sendFavorite()"
      >
        {{ favoriteLabel("Confirm favorite action") }}
      </button>
      <article
        v-for="attempt in favorite.attempts"
        :key="attempt.id"
        :data-favorite-attempt="attempt.id"
      >
        <p>
          {{ favoriteLabel(attempt.command.intent.action) }}
          {{ favoriteLabel(attempt.command.intent.kind) }}
          {{ attempt.command.intent.targetId }} · {{ favoriteLabel("Account") }}
          {{ attempt.command.intent.accountId
          }}<template v-if="attempt.command.intent.recordId">
            · {{ favoriteLabel("Favorite record") }}
            {{ attempt.command.intent.recordId }}</template
          >
          ·
          {{ favoriteLabel(attempt.status) }}
        </p>
        <button
          v-if="attempt.status === 'uncertain' && attempt.checked"
          :disabled="favorite.busy"
          @click="workspace.resendFavorite(attempt.id)"
        >
          {{ favoriteLabel("Review new favorite attempt") }}
        </button>
        <button
          v-if="attempt.status === 'uncertain'"
          :disabled="favorite.busy"
          @click="workspace.checkFavorite(attempt.id)"
        >
          {{ favoriteLabel("Check favorite result") }}
        </button>
      </article>
    </section>
    <main
      v-show="!writing.visible"
      class="workspace-body"
      :data-view="state.result?.kind ?? 'unavailable'"
    >
      <nav :aria-label="text.mainDestinations" class="main-destinations pane">
        <button
          v-for="section in sections"
          :key="section"
          :aria-current="state.section === section ? 'page' : undefined"
          @click="workspace.openSection(section)"
        >
          {{ text[section] }}
        </button>
      </nav>
      <nav
        v-if="state.section === 'boards'"
        :aria-label="text.boardsNavigation"
        class="boards-navigation pane"
      >
        <h2>{{ text.browseBoards }}</h2>
        <a href="https://www.tsdm39.com/forum.php">{{ text.allBoards }}</a
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
      <nav
        v-if="sectionInfo"
        class="boards-navigation pane"
        :aria-label="text.sectionNavigation"
      >
        <h2>{{ sectionInfo.title }}</h2>
        <p v-for="label in sectionInfo.secondary" :key="label">{{ label }}</p>
      </nav>
      <section
        v-if="sectionInfo"
        class="overview pane"
        data-scroll-pane="overview"
      >
        <h1>{{ sectionInfo.title }}</h1>
        <h2>{{ sectionInfo.heading }}</h2>
        <p>{{ sectionInfo.description }}</p>
        <template v-if="state.section === 'drafts'">
          <button
            :disabled="workspace.drafts.value.loading"
            @click="workspace.loadDrafts()"
          >
            {{ text.loadDrafts }}
          </button>
          <p
            v-if="
              workspace.drafts.value.result &&
              workspace.drafts.value.result.kind !== 'drafts'
            "
            role="alert"
          >
            {{
              description(
                workspace.drafts.value.result.message,
                workspace.preferences.state.value.language,
              )
            }}
          </p>
          <template v-if="workspace.drafts.value.result?.kind === 'drafts'">
            <p>{{ workspace.drafts.value.result.drafts.empty }}</p>
            <ul>
              <li
                v-for="draft in workspace.drafts.value.result.drafts.rows"
                :key="draft.threadId"
              >
                <button
                  :aria-label="insert(text.resumeDraft, draft.title)"
                  @click="
                    workspace.writing.resumeDraft(
                      draft as import('../forum-client').DraftRow,
                      workspace.drafts.value.result!.account,
                    )
                  "
                >
                  {{ draft.title }}
                </button>
                · {{ insert(text.writingBoard, draft.boardId) }}
                <div
                  v-for="attempt in writing.context?.draftAttempts?.filter(
                    (a) =>
                      a.status === 'uncertain' &&
                      a.operation !== 'publish' &&
                      !a.submission.writing.draft,
                  )"
                  :key="attempt.id"
                  role="group"
                  :aria-label="insert(text.draftAttempt, attempt.id)"
                >
                  <span>{{ insert(text.draftAttempt, attempt.id) }}</span>
                  <button
                    :aria-label="insert(text.checkDraftRevision, draft.title)"
                    :disabled="writing.publishing || writing.preparing"
                    @click="
                      workspace.writing.checkDraft(
                        attempt.id,
                        draft as import('../forum-client').DraftRow,
                      )
                    "
                  >
                    {{ text.checkDraftSave }}
                  </button>
                </div>
              </li>
            </ul>
            <nav :aria-label="text.draftPages">
              <button
                v-for="link in workspace.drafts.value.result.drafts.pages.links"
                :key="link.url"
                :aria-label="insert(text.draftPage, link.label)"
                :disabled="workspace.drafts.value.loading"
                @click="workspace.loadDrafts(link.url)"
              >
                {{ link.label }}
              </button>
            </nav>
          </template>
        </template>
        <a :href="nativeDestination(sectionInfo.nativeURL)">{{
          text.native
        }}</a>
      </section>
      <nav
        v-if="state.section === 'search'"
        class="boards-navigation pane"
        :aria-label="text.searchNavigation"
      >
        <h2>{{ text.search }}</h2>
        <a href="https://www.tsdm39.com/search.php?mod=forum&adv=yes">{{
          text.newSearch
        }}</a>
        <p>{{ text.deliberateSearch }}</p>
      </nav>
      <SearchView
        v-if="searchContext"
        :search="searchContext"
        :language="workspace.preferences.state.value.language"
        :secondary="state.result?.kind === 'thread'"
        :selection="state.selection ?? selectedThread"
        :loading="state.loading"
        @submit="workspace.submitSearch"
        @edit="workspace.editSearch"
      />
      <FavoritesView
        v-if="state.section === 'saved'"
        :favorites="favoriteContext"
        :secondary="state.result?.kind === 'thread'"
        :board-target="state.result?.kind === 'board'"
        :loading="state.loading"
        :language="workspace.preferences.state.value.language"
        @remove="
          (kind, targetId, recordId) =>
            workspace.prepareFavorite('remove', kind, targetId, recordId)
        "
        @load="
          (kind) =>
            workspace.openThread(
              `https://www.tsdm39.com/home.php?mod=space&do=favorite&type=${kind}`,
            )
        "
      />
      <NoticesView
        v-if="state.section === 'notices'"
        :notices="noticeContext"
        :loading="state.loading"
        :language="workspace.preferences.state.value.language"
        :secondary="state.result?.kind === 'thread'"
        :selection="state.selection"
        @load="workspace.loadNotices()"
      />
      <nav
        v-if="state.section === 'notices'"
        class="boards-navigation pane notices-navigation"
        :aria-label="text.noticeCategories"
      >
        <h2>{{ text.notices }}</h2>
        <a
          v-for="category in noticeContext?.categories ?? []"
          :key="category.url"
          :href="category.url"
          :aria-current="category.current ? 'page' : undefined"
          >{{ category.label }}</a
        >
        <p v-if="!noticeContext">{{ text.noticesHeading }}</p>
      </nav>
      <section
        v-if="state.section === 'boards' && state.result?.kind === 'directory'"
        class="overview pane"
        data-scroll-pane="overview"
        :aria-label="text.boardsOverview"
      >
        <h1>{{ text.boards }}</h1>
        <p>{{ text.chooseBoardDescription }}</p>
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
        <nav :aria-label="text.directoryPages">
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
        :aria-label="text.threadResults"
      >
        <h1>{{ boardContext.title }}</h1>
        <section v-if="boardContext.boards.length">
          <h2>{{ text.subordinateBoards }}</h2>
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
        <nav :aria-label="text.boardFilters">
          <a
            v-for="filter in boardContext.filters"
            :key="filter.url"
            :href="filter.url"
            >{{ filter.label }}</a
          >
        </nav>
        <ul :aria-label="text.criteria">
          <li v-for="criterion in boardContext.criteria" :key="criterion.label">
            {{ criterion.label }}
          </li>
        </ul>
        <p>{{ text.page }} {{ boardContext.pages.current }}</p>
        <div
          v-for="row in boardContext.threads"
          :id="`row-${row.rowId}`"
          :key="row.rowId"
          class="thread-row"
          :data-thread-id="row.id"
        >
          <span v-if="row.pinned">{{ text.pinned }}</span
          ><span v-if="row.moved">{{ text.moved }}</span
          ><span>{{ row.category }}</span
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
          ><span
            >{{ row.replies }} {{ text.replies }} · {{ row.views }}
            {{ text.views }}</span
          ><a v-if="row.lastPost" :href="row.lastPost.url">{{
            insert(text.lastReply, row.label)
          }}</a>
        </div>
        <p v-if="!boardContext.threads.length">{{ boardContext.empty }}</p>
        <nav :aria-label="text.boardPages">
          <a
            v-for="link in boardContext.pages.links"
            :key="link.url"
            :href="link.url"
            >{{ link.label }}</a
          >
        </nav>
      </section>
      <section
        v-if="
          ['boards', 'search', 'notices', 'saved'].includes(state.section) &&
          state.result?.kind === 'thread'
        "
        class="reading-pane pane"
        data-scroll-pane="reading"
        :aria-label="text.threadReading"
      >
        <section class="thread-heading">
          <p class="eyebrow">{{ text.thread }} {{ state.result.thread.id }}</p>
          <h1>{{ state.result.thread.title }}</h1>
          <p>{{ text.page }} {{ state.result.thread.pages.current }}</p>
          <a
            v-if="state.result.thread.parent"
            :href="state.result.thread.parent.url"
            >{{ state.result.thread.parent.label }}</a
          >
        </section>
        <nav :aria-label="text.threadFilters">
          <a
            v-for="filter in state.result.thread.filters"
            :key="filter.url"
            :href="filter.url"
            >{{ filter.label }}</a
          >
        </nav>
        <p v-if="missingTarget" role="alert">
          {{ insert(text.missingPost, state.result.thread.target ?? "") }}
        </p>
        <p
          v-for="notice in state.result.thread.notices"
          :key="notice"
          class="permission-notice"
        >
          {{ notice }}
        </p>
        <button
          v-if="state.result.thread.parent"
          @click="
            workspace.writing.prepareReply(
              boardIdFrom(state.result.thread.parent.url),
              {
                threadId: state.result.thread.id,
                postId: null,
                author: '',
                authorId: null,
              },
            )
          "
        >
          {{ text.replyToThread }}
        </button>
        <article
          v-for="post in state.result.thread.posts"
          :id="`pid${post.id}`"
          :key="post.id"
          :aria-label="`${text.post} ${post.id}`"
          :data-targeted="state.result.thread.target === post.id"
          tabindex="-1"
        >
          <header>
            <strong>{{ post.author }}</strong
            ><span>{{ text.floor }} {{ post.floor || text.unknown }}</span
            ><time>{{ post.date }}</time
            ><a :href="post.url">{{ text.post }} {{ post.id }}</a>
          </header>
          <button
            v-if="state.result.thread.parent"
            @click="
              workspace.writing.prepareReply(
                boardIdFrom(state.result.thread.parent.url),
                {
                  threadId: state.result.thread.id,
                  postId: post.id,
                  author: post.author,
                  authorId: post.authorId,
                },
              )
            "
          >
            {{ text.quickQuote }}
          </button>
          <button
            v-if="
              state.result.account.kind === 'member' &&
              post.authorId === state.result.account.id
            "
            @click="
              workspace.writing.prepareEdit(state.result.thread.url, post.id)
            "
          >
            {{ insert(text.editPost, post.id) }}
          </button>
          <ContentView
            :nodes="post.content"
            :language="workspace.preferences.state.value.language"
          />
          <ul v-if="post.attachments?.length" :aria-label="text.attachments">
            <li v-for="attachment in post.attachments" :key="attachment.id">
              <button
                :disabled="download?.status === 'checking'"
                @click="workspace.prepareDownload(post.id, attachment.id)"
              >
                {{ text.download }} {{ attachment.name }}
              </button>
              <section
                v-if="
                  download?.postId === post.id &&
                  download?.attachmentId === attachment.id
                "
                data-download-status
                :aria-label="text.fileDownload"
              >
                <strong>{{ download.name }}</strong>
                <p :role="download.status === 'failure' ? 'alert' : 'status'">
                  {{
                    description(
                      download.message,
                      workspace.preferences.state.value.language,
                    )
                  }}
                </p>
                <button
                  v-if="
                    download.status === 'ready' ||
                    download.status === 'requested'
                  "
                  @click="workspace.saveDownload()"
                >
                  {{ text.saveFile }}
                </button>
              </section>
            </li>
          </ul>
        </article>
        <nav :aria-label="text.pages">
          <a
            v-for="link in state.result.thread.pages.links"
            :key="link.url"
            :href="link.url"
            >{{ link.label }}</a
          >
        </nav>
      </section>
      <section
        v-if="state.result?.kind === 'board'"
        class="board-overview pane"
      >
        <h2>{{ text.chooseThread }}</h2>
        <p>
          {{ text.chooseThreadDescription }}
        </p>
      </section>
    </main>
  </div>
</template>
