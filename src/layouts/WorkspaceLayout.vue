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
import MessagesView from "../components/MessagesView.vue";
import PrivateConversationView from "../components/PrivateConversationView.vue";
import NoticesView from "../components/NoticesView.vue";
import SourceWriting from "../components/SourceWriting.vue";
import WritingDestination from "../components/WritingDestination.vue";
import { editorText } from "../components/editor-strings";
import ContentView from "../components/ContentView";
import SettingsDialog from "../components/SettingsDialog.vue";
import type { Workspace } from "../workspace";
import { describeDestination } from "../forum-client";
import { nativeDestination } from "../hosts/browser";
import { strings, insert, description } from "./strings";
import type { Section } from "../workspace/navigation";
const props = defineProps<{ workspace: Workspace; portal: HTMLElement }>();
const state = props.workspace.state;
const history = props.workspace.threadHistory.state;
const privateHistory = props.workspace.privateHistory.state;
const privateRecipientId = computed(
  () => new URL(state.value.destination).searchParams.get("touid") ?? "",
);
const privateThreadChange = computed(() => {
  const pending = props.workspace.pendingThread.value;
  return (
    pending && describeDestination(pending.url)?.kind === "private-conversation"
  );
});
const pendingPrivate = computed(
  () =>
    describeDestination(state.value.destination)?.kind ===
      "private-conversation" && !state.value.privateReading,
);
const reading = computed(() =>
  state.value.privateReading
    ? null
    : (history.value.result ?? state.value.reading),
);
const boardsCollapsed = ref(false);
const threadsCollapsed = ref(false);
const paneWidth = ref(window.innerWidth);
const boardsDocked = computed(() => paneWidth.value >= 960);
const threadsDocked = computed(() => paneWidth.value >= 768);
type DrawerPane = "boards" | "threads";
const drawer = ref<DrawerPane | null>(null);
const drawerContent = ref<HTMLElement | null>(null);
const drawerClose = ref<HTMLButtonElement | null>(null);
const boardContextTools = ref<HTMLElement | null>(null);
const threadContextTools = ref<HTMLElement | null>(null);
const contextTools = computed(() =>
  state.value.result?.kind === "thread"
    ? threadContextTools.value
    : boardContextTools.value,
);
const boardsTrigger = ref<HTMLButtonElement | null>(null);
const threadsTrigger = ref<HTMLButtonElement | null>(null);
const paneScroll = new Map<HTMLElement, number>();
let drawerReturnFocus: HTMLButtonElement | null = null;
function rememberPaneScroll() {
  for (const pane of workspaceHost().shadowRoot?.querySelectorAll<HTMLElement>(
    ".pane",
  ) ?? [])
    if (pane.getClientRects().length) paneScroll.set(pane, pane.scrollTop);
}
function restorePaneScroll() {
  for (const [pane, top] of paneScroll) {
    if (!pane.isConnected) paneScroll.delete(pane);
    else if (
      pane.getClientRects().length &&
      !pane.classList.contains("reading-pane")
    )
      pane.scrollTop = top;
  }
}
function changeDrawer(next: DrawerPane | null) {
  rememberPaneScroll();
  if (next)
    drawerReturnFocus =
      next === "boards" ? boardsTrigger.value : threadsTrigger.value;
  drawer.value = next;
  void nextTick().then(() => {
    restorePaneScroll();
    if (next) drawerClose.value?.focus({ preventScroll: true });
    else drawerReturnFocus?.focus({ preventScroll: true });
    appearanceAnchors = [];
    rememberPositions();
  });
}
let outsidePress = false;
function outsideDrawer(event: MouseEvent) {
  const bounds = drawerContent.value?.parentElement?.getBoundingClientRect();
  return (
    !!bounds &&
    (event.clientX < bounds.left ||
      event.clientX >= bounds.right ||
      event.clientY < bounds.top ||
      event.clientY >= bounds.bottom)
  );
}
function drawerPointerDown(event: PointerEvent) {
  outsidePress = event.isPrimary && event.button === 0 && outsideDrawer(event);
}
function drawerContentClick(event: MouseEvent) {
  drawerClick(event);
  navigate(event);
}
function drawerClick(event: MouseEvent) {
  const startedOutside = outsidePress;
  outsidePress = false;
  if (startedOutside && event.button === 0 && outsideDrawer(event))
    closeDrawer();
}
function focusDrawer(event: Event) {
  event.preventDefault();
  restorePaneScroll();
  drawerClose.value?.focus({ preventScroll: true });
}
function closeDrawer() {
  const change = () => changeDrawer(null);
  if (!props.workspace.writing.deferViewChange(change)) change();
}
function togglePane(pane: DrawerPane) {
  const change = () => {
    if (!(pane === "boards" ? boardsDocked.value : threadsDocked.value)) {
      changeDrawer(drawer.value === pane ? null : pane);
      return;
    }
    const positions = capturePositions();
    rememberPaneScroll();
    if (pane === "boards") boardsCollapsed.value = !boardsCollapsed.value;
    else threadsCollapsed.value = !threadsCollapsed.value;
    void nextTick().then(() => {
      restorePaneScroll();
      restorePositions(positions, true);
    });
  };
  if (!props.workspace.writing.deferViewChange(change)) change();
}
function guardEscape(event: KeyboardEvent) {
  if (event.isComposing || event.keyCode === 229) event.preventDefault();
}
function drawerEscape(event: KeyboardEvent) {
  event.preventDefault();
  if (
    event.isComposing ||
    event.keyCode === 229 ||
    props.workspace.writing.state.value.composing
  )
    return;
  event.stopPropagation();
  closeDrawer();
}
function revealResults() {
  threadsCollapsed.value = false;
  if (!threadsDocked.value) changeDrawer("threads");
  else if (drawer.value === "boards") changeDrawer(null);
}
watch(
  () => state.value.result,
  (result, previous) => {
    if (
      result &&
      [
        "board",
        "directory",
        "search",
        "favorites",
        "notices",
        "messages",
      ].includes(result.kind)
    ) {
      if (result.kind === "board" || result.kind === "directory")
        threadsCollapsed.value = false;
      if (
        (drawer.value === "boards" && result !== previous) ||
        (!previous && !reading.value && !state.value.privateReading)
      )
        revealResults();
    }
  },
);
watch(
  () => state.value.section,
  (section, previous) => {
    if (section !== previous) {
      if (
        ["thread", "private-conversation"].includes(
          state.value.result?.kind ?? "",
        )
      ) {
        if (drawer.value) changeDrawer(null);
      } else revealResults();
    }
  },
);
watch(
  () => [state.value.reading, state.value.privateReading] as const,
  ([next, nextPrivate], [previous, previousPrivate]) => {
    if (
      ((next && next !== previous) ||
        (nextPrivate && nextPrivate !== previousPrivate)) &&
      drawer.value === "threads"
    )
      changeDrawer(null);
  },
);
const text = computed(() =>
  strings(props.workspace.preferences.state.value.language),
);
const threadFilters = computed(() => {
  const result = reading.value;
  if (!result) return [];
  return result.thread.filters.map((filter) => {
    const url = new URL(filter.url);
    const authorId = url.searchParams.get("authorid");
    const authors = result.thread.posts.filter(
      (post) => post.authorId === authorId && authorId !== null,
    );
    const known =
      url.origin === new URL(result.thread.url).origin &&
      url.searchParams.get("tid") === result.thread.id &&
      authors.length > 0 &&
      new Set(authors.map((post) => post.author)).size === 1;
    const author = known ? authors[0]! : null;
    return {
      ...filter,
      authorId: author?.authorId ?? null,
      label: author
        ? filter.label.includes(author.author)
          ? filter.label
          : `${filter.label}: ${author.author}`
        : authorId !== null
          ? `${text.value.authorFilter}: ${filter.label}`
          : filter.label,
    };
  });
});
const sections: Section[] = [
  "boards",
  "search",
  "saved",
  "notices",
  "messages",
  "drafts",
];
const sectionInfo = computed(() => {
  const section = state.value.section;
  if (
    section === "boards" ||
    section === "search" ||
    section === "messages" ||
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
function selectSection(section: Section) {
  const change = () => {
    const positions = capturePositions();
    revealResults();
    void nextTick().then(() => restorePositions(positions, true));
    void props.workspace.openSection(section);
  };
  if (!props.workspace.writing.deferViewChange(change)) change();
}
function chooseSection(event: Event) {
  if (
    event.target instanceof HTMLSelectElement &&
    sections.includes(event.target.value as Section)
  )
    selectSection(event.target.value as Section);
}
type PanePosition = {
  pane: HTMLElement;
  anchor: HTMLElement;
  offset: number;
  paneTop: number;
};
let viewportPositions: PanePosition[] = [];
type RestoredAnchor = PanePosition & {
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
            offset: previous?.offset ?? anchor.getBoundingClientRect().top,
            paneTop: previous?.paneTop ?? bounds.top,
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
  suppressAutomaticHistory();
  for (const { pane, anchor, offset, paneTop } of positions)
    if (anchor.isConnected && pane.getClientRects().length)
      pane.scrollTop +=
        anchor.getBoundingClientRect().top -
        offset -
        (relativeToPane ? pane.getBoundingClientRect().top - paneTop : 0);
}
function resize() {
  const positions = viewportPositions;
  appearanceAnchors = [];
  rememberPaneScroll();
  paneWidth.value = window.innerWidth;
  if (
    drawer.value &&
    (drawer.value === "boards" ? boardsDocked.value : threadsDocked.value)
  )
    changeDrawer(null);
  void nextTick().then(() => {
    restorePositions(
      positions.filter(({ pane }) => pane.classList.contains("reading-pane")),
      true,
    );
    restorePaneScroll();
    rememberPositions();
  });
  viewportWidth = window.innerWidth;
  viewportHeight = window.innerHeight;
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
      appearanceAnchors = positions.map((position) => ({
        ...position,
        scrollTop: position.pane.scrollTop,
      }));
      rememberPositions();
    });
  },
  { immediate: true, flush: "sync" },
);
const favorite = props.workspace.favorite;
const favoriteLabel = (value: string) =>
  favoriteText(value, props.workspace.preferences.state.value.language);
watch(
  () => favorite.value.prepared,
  (prepared) => {
    if (prepared && drawer.value) changeDrawer(null);
  },
);
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
const writingExpanded = ref(false);
watch(
  () => writing.value.context?.id,
  () => {
    const context = writing.value.context;
    writingExpanded.value = Boolean(context && !context.replyTarget);
    if (context && drawer.value) changeDrawer(null);
  },
  { immediate: true },
);
function resizeWriting(expanded: boolean) {
  const change = () => {
    writingExpanded.value = expanded;
  };
  if (!props.workspace.writing.deferViewChange(change)) change();
}
const retainedAttemptWarning = computed(() => {
  const context = writing.value.context;
  return (
    writing.value.publishing ||
    context?.attempts?.some((a) =>
      ["pending", "uncertain", "moderation"].includes(a.status),
    ) ||
    context?.draftAttempts?.some((a) =>
      ["pending", "uncertain", "moderation"].includes(a.status),
    ) ||
    context?.uploads?.some((u) =>
      ["uploading", "removing", "uncertain", "removal-uncertain"].includes(
        u.status,
      ),
    )
  );
});
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
const boardFilterGroups = computed(() => {
  const board = boardContext.value;
  if (!board) return [];
  return (
    board.filterGroups ??
    (board.filters.length
      ? [
          {
            kind: "unclassified" as const,
            sourceId: "legacy",
            links: board.filters,
          },
        ]
      : [])
  ).map((group) => ({
    ...group,
    label:
      group.sourceLabel ||
      {
        category: text.value.filterCategory,
        order: text.value.filterOrder,
        type: text.value.filterType,
        time: text.value.filterTime,
        unclassified: text.value.filterOther,
      }[group.kind],
  }));
});
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
const threadWithoutResults = computed(
  () =>
    state.value.section === "boards" &&
    reading.value !== null &&
    state.value.result?.kind !== "directory" &&
    !boardContext.value &&
    !searchContext.value &&
    !favoriteContext.value &&
    !noticeContext.value,
);
const selectedThread = computed(() => reading.value?.thread.id ?? null);
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
const boardFilter = ref("");
const boardFilterInput = ref<HTMLInputElement | null>(null);
const filteredBoardGroups = computed(() => {
  if (state.value.result?.kind !== "directory") return [];
  const query = boardFilter.value.trim().toLocaleLowerCase();
  return state.value.result.directory.groups
    .map((group) => ({
      ...group,
      boards: group.boards.filter((board) =>
        [group.title, board.label, board.description].some((value) =>
          value.toLocaleLowerCase().includes(query),
        ),
      ),
    }))
    .filter((group) => group.boards.length);
});
const filteredBoardCount = computed(() =>
  filteredBoardGroups.value.reduce(
    (count, group) => count + group.boards.length,
    0,
  ),
);
function clearBoardFilter() {
  boardFilter.value = "";
  boardFilterInput.value?.focus();
}
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
  const result = reading.value;
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
  if (event.defaultPrevented) return;
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
  const current = reading.value;
  if (current) {
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
      link.closest("[data-peer-id]")?.getAttribute("data-peer-id") ??
      null,
  );
}
let historyFrame: number | null = null;
let restoringHistory = false;
let restorationFrame: number | null = null;
// Restoration scroll events can arrive in the next rendering frame.
function suppressAutomaticHistory() {
  restoringHistory = true;
  if (restorationFrame !== null) cancelAnimationFrame(restorationFrame);
  restorationFrame = requestAnimationFrame(() => {
    restorationFrame = requestAnimationFrame(() => {
      restorationFrame = null;
      restoringHistory = false;
    });
  });
}
function approachHistory(event: Event) {
  const pane = event.currentTarget;
  if (
    !(pane instanceof HTMLElement) ||
    historyFrame !== null ||
    restoringHistory
  )
    return;
  historyFrame = requestAnimationFrame(() => {
    historyFrame = null;
    if (
      restoringHistory ||
      document.hidden ||
      [
        ...(workspaceHost().shadowRoot?.querySelectorAll(
          '[role="dialog"], [role="alertdialog"]',
        ) ?? []),
      ].some((dialog) => dialog.getClientRects().length > 0) ||
      !pane.isConnected ||
      !pane.getClientRects().length
    )
      return;
    if (pane.scrollTop <= 160 && history.value.earlier.status === "unloaded")
      void props.workspace.threadHistory.load("earlier", true);
    else if (
      pane.scrollHeight - pane.clientHeight - pane.scrollTop <= 160 &&
      history.value.later.status === "unloaded"
    )
      void props.workspace.threadHistory.load("later", true);
  });
}
onUnmounted(() => {
  if (historyFrame !== null) cancelAnimationFrame(historyFrame);
  if (restorationFrame !== null) cancelAnimationFrame(restorationFrame);
});
let stopReadingImageRestore: (() => void) | undefined;
function followPendingReadingImages(
  container: HTMLElement,
  target: HTMLElement,
  savedOffset: number | null,
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
    suppressAutomaticHistory();
    if (savedOffset !== null)
      container.scrollTop += target.getBoundingClientRect().top - savedOffset;
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
      `[data-scroll-pane="${["thread", "private-conversation"].includes(state.value.result?.kind ?? "") || describeDestination(state.value.destination)?.kind === "private-conversation" ? "reading" : state.value.result?.kind === "board" ? "results" : "overview"}"]`,
    );
  const capturePane = (container: HTMLElement | null | undefined) => {
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
      readingScrollTop:
        root.shadowRoot?.querySelector<HTMLElement>(".reading-pane")
          ?.scrollTop ?? 0,
      resultsScrollTop:
        root.shadowRoot?.querySelector<HTMLElement>(
          ".results-pane, .messages-pane",
        )?.scrollTop ?? 0,
    };
  };
  props.workspace.setViewAdapter({
    capture: () => capturePane(pane()),
    captureReading: () =>
      capturePane(root.shadowRoot?.querySelector<HTMLElement>(".reading-pane")),
    restoreReading(position) {
      suppressAutomaticHistory();
      stopReadingImageRestore?.();
      const container =
        root.shadowRoot?.querySelector<HTMLElement>(".reading-pane");
      if (!container) return;
      container.scrollTop = position.scrollTop;
      const node = position.anchor
        ? root.shadowRoot?.getElementById(position.anchor)
        : null;
      if (node && container.contains(node)) {
        container.scrollTop +=
          node.getBoundingClientRect().top - position.offset;
        followPendingReadingImages(container, node, position.offset);
      }
    },
    restore(position, target, selection) {
      suppressAutomaticHistory();
      stopReadingImageRestore?.();

      const container = pane();
      if (container) container.scrollTop = position?.scrollTop ?? 0;
      const reader =
        root.shadowRoot?.querySelector<HTMLElement>(".reading-pane");
      const results = root.shadowRoot?.querySelector<HTMLElement>(
        ".results-pane, .messages-pane",
      );
      if (reader && position?.readingScrollTop !== undefined)
        reader.scrollTop = position.readingScrollTop;
      if (results && position?.resultsScrollTop !== undefined)
        results.scrollTop = position.resultsScrollTop;
      const node = target
        ? root.shadowRoot?.getElementById(
            `${state.value.privateReading ? "pmlist_" : "pid"}${target}`,
          )
        : position?.anchor
          ? root.shadowRoot?.getElementById(position.anchor)
          : null;
      if (
        container &&
        node &&
        position &&
        (!target || position.readingScrollTop !== 0)
      )
        container.scrollTop +=
          node.getBoundingClientRect().top - position.offset;
      if (node && (!position || position.readingScrollTop === 0))
        node.scrollIntoView({ block: "start" });
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
      if (!writing.value.visible && !writing.value.composing)
        (node ?? selected)?.focus({ preventScroll: true });
      if (container && node)
        followPendingReadingImages(
          container,
          node,
          target && position?.readingScrollTop === 0
            ? null
            : (position?.offset ?? null),
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
    <DialogRoot
      :open="workspace.pendingThread.value !== null"
      @update:open="
        (value) => {
          if (!value) workspace.cancelThreadChange();
        }
      "
    >
      <DialogPortal :to="portal"
        ><DialogOverlay class="dialog-overlay thread-change-overlay" />
        <DialogContent
          class="dialog-content thread-change-dialog"
          @escape-key-down="guardEscape"
        >
          <DialogTitle>{{ text.threadChangeTitle }}</DialogTitle>
          <DialogDescription>{{
            privateThreadChange
              ? text.privateChangeDescription
              : text.threadChangeDescription
          }}</DialogDescription>
          <button
            @click="
              workspace.cancelThreadChange();
              closeDrawer();
            "
          >
            {{ text.continueEditing }}
          </button>
          <button @click="workspace.retainWritingAndRead()">
            {{
              privateThreadChange
                ? text.retainWritingReadPrivate
                : text.retainWritingRead
            }}
          </button>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
    <DialogRoot
      :open="drawer !== null"
      :unmount-on-hide="false"
      @update:open="
        (value) => {
          if (!value) closeDrawer();
        }
      "
    >
      <DialogPortal :to="portal" force-mount>
        <DialogOverlay
          class="dialog-overlay pane-drawer-overlay"
          @pointerdown="drawerPointerDown"
          @pointercancel="outsidePress = false"
          @click="drawerClick"
        />
        <DialogContent
          class="pane-drawer"
          aria-modal="true"
          :aria-describedby="undefined"
          @escape-key-down="drawerEscape"
          @pointer-down-outside.prevent
          @interact-outside.prevent
          @open-auto-focus="focusDrawer"
          @close-auto-focus.prevent
          @click="drawerContentClick"
          @pointerdown="drawerPointerDown"
          @pointercancel="outsidePress = false"
        >
          <div class="pane-drawer-heading">
            <DialogTitle>{{
              drawer === "boards" ? text.boardsNavigation : text.threadResults
            }}</DialogTitle>
            <button ref="drawerClose" @click="closeDrawer">
              {{ text.close }}
            </button>
          </div>
          <div ref="drawerContent" class="pane-drawer-content" />
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
    <header>
      <a class="brand" href="https://www.tsdm39.com/">TSDM</a
      ><span class="header-account">{{ accountLabel }}</span>
      <button
        ref="boardsTrigger"
        :aria-label="text.boardsPane"
        :aria-expanded="boardsDocked ? !boardsCollapsed : drawer === 'boards'"
        aria-controls="boards-pane"
        @click="togglePane('boards')"
      >
        {{ text.boards }}
      </button>
      <button
        ref="threadsTrigger"
        :aria-label="text.threadsPane"
        :aria-expanded="
          threadsDocked ? !threadsCollapsed : drawer === 'threads'
        "
        aria-controls="thread-list-pane"
        @click="togglePane('threads')"
      >
        {{ text.threadResults }}
      </button>
      <SettingsDialog :workspace="workspace" :portal="portal" />
      <div id="navigation-preferences" class="navigation-preferences">
        <DialogRoot :open="aboutOpen" @update:open="changeAboutOpen"
          ><DialogTrigger>{{ text.about }}</DialogTrigger
          ><DialogPortal :to="portal"
            ><DialogOverlay class="dialog-overlay" /><DialogContent
              class="dialog-content"
              @keydown.esc="closeAboutOnEscape"
              ><DialogTitle>{{ text.about }}</DialogTitle
              ><DialogDescription>{{
                text.aboutDescription
              }}</DialogDescription>
              <p>
                {{ text.nativeHelp }}
              </p>
              <DialogClose>{{ text.close }}</DialogClose></DialogContent
            ></DialogPortal
          ></DialogRoot
        >
      </div>
    </header>
    <Teleport :to="contextTools ?? portal" :disabled="!contextTools">
      <div id="navigation-tools" class="workspace-tools">
        <nav :aria-label="text.actions">
          <a
            v-if="
              state.result?.kind !== 'directory' &&
              state.result?.kind !== 'thread'
            "
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
            :href="
              nativeDestination(sectionInfo?.nativeURL ?? state.destination)
            "
            >{{ text.native }}</a
          >
          <button
            v-if="
              state.result?.kind === 'thread' || state.result?.kind === 'board'
            "
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
        </nav>
      </div>
    </Teleport>
    <Teleport :to="boardContextTools ?? portal" :disabled="!boardContextTools">
      <div class="workspace-tools board-navigation-tools">
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
    </Teleport>
    <Teleport :to="boardContextTools ?? portal" :disabled="!boardContextTools">
      <div
        id="navigation-writing-actions"
        class="writing-actions secondary-writing-actions"
      >
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
      </div>
    </Teleport>
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
          ['boards', 'search', 'notices', 'messages', 'saved'].includes(
            state.section,
          ) &&
          state.result &&
          ![
            'directory',
            'board',
            'thread',
            'search',
            'notices',
            'favorites',
            'messages',
            'private-conversation',
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
      class="workspace-body"
      :class="{ 'thread-without-results': threadWithoutResults }"
      :data-boards-collapsed="!boardsDocked || boardsCollapsed"
      :data-threads-collapsed="!threadsDocked || threadsCollapsed"
      :data-view="state.result?.kind ?? 'unavailable'"
    >
      <Teleport
        :to="drawerContent ?? portal"
        :disabled="drawer !== 'boards' || !drawerContent"
      >
        <div
          v-show="(boardsDocked && !boardsCollapsed) || drawer === 'boards'"
          id="boards-pane"
          class="boards-region pane"
        >
          <nav :aria-label="text.mainDestinations" class="main-destinations">
            <button
              v-for="section in sections"
              :key="section"
              :aria-current="state.section === section ? 'page' : undefined"
              @click="selectSection(section)"
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
              v-else-if="reading?.thread.parent"
              :href="reading.thread.parent.url"
              >{{ reading.thread.parent.label }}</a
            ><a
              v-for="board in boardChoices"
              :key="board.url"
              :href="board.url"
              >{{ board.label }}</a
            >
          </nav>
          <nav
            v-if="sectionInfo"
            class="boards-navigation pane"
            :aria-label="text.sectionNavigation"
          >
            <h2>{{ sectionInfo.title }}</h2>
            <p v-for="label in sectionInfo.secondary" :key="label">
              {{ label }}
            </p>
          </nav>
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
          <div ref="boardContextTools" class="board-context-tools" />
        </div>
      </Teleport>
      <Teleport
        :to="drawerContent ?? portal"
        :disabled="drawer !== 'threads' || !drawerContent"
      >
        <section
          v-if="sectionInfo"
          v-show="(threadsDocked && !threadsCollapsed) || drawer === 'threads'"
          id="thread-list-pane"
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
                  v-for="link in workspace.drafts.value.result.drafts.pages
                    .links"
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
        <SearchView
          v-if="searchContext"
          v-show="(threadsDocked && !threadsCollapsed) || drawer === 'threads'"
          id="thread-list-pane"
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
          v-show="(threadsDocked && !threadsCollapsed) || drawer === 'threads'"
          id="thread-list-pane"
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
        <MessagesView
          v-if="state.section === 'messages'"
          v-show="(threadsDocked && !threadsCollapsed) || drawer === 'threads'"
          id="thread-list-pane"
          :selected="
            state.privateReading?.conversation.peerId ?? state.selection
          "
          :messages="
            state.result?.kind === 'messages'
              ? state.result.messages
              : state.origin?.kind === 'messages'
                ? state.origin.messages
                : null
          "
          :loading="state.loading"
          :language="workspace.preferences.state.value.language"
          @load="workspace.loadMessages()"
        />
        <NoticesView
          v-if="state.section === 'notices'"
          v-show="(threadsDocked && !threadsCollapsed) || drawer === 'threads'"
          id="thread-list-pane"
          :notices="noticeContext"
          :loading="state.loading"
          :language="workspace.preferences.state.value.language"
          :secondary="state.result?.kind === 'thread'"
          :selection="state.selection"
          @load="workspace.loadNotices()"
        />
        <section
          v-if="
            state.section === 'boards' && state.result?.kind === 'directory'
          "
          v-show="(threadsDocked && !threadsCollapsed) || drawer === 'threads'"
          id="thread-list-pane"
          class="overview pane"
          data-scroll-pane="overview"
          :aria-label="text.boardsOverview"
        >
          <h1>{{ text.boards }}</h1>
          <p>{{ text.chooseBoardDescription }}</p>
          <div class="board-filter">
            <label for="board-filter">{{ text.filterBoards }}</label>
            <input
              id="board-filter"
              ref="boardFilterInput"
              v-model="boardFilter"
              type="search"
              aria-describedby="board-filter-scope"
            />
            <button v-if="boardFilter" @click="clearBoardFilter">
              {{ text.clearBoardFilter }}
            </button>
          </div>
          <p id="board-filter-scope" class="board-filter-scope">
            {{ text.boardFilterScope }}
          </p>
          <p class="board-filter-status" role="status">
            {{
              insert(
                text.boardsShown,
                `${filteredBoardCount} / ${boardChoices.length}`,
              )
            }}
          </p>
          <p v-if="!filteredBoardGroups.length">{{ text.noBoardMatches }}</p>
          <section
            v-for="group in filteredBoardGroups"
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
          v-show="(threadsDocked && !threadsCollapsed) || drawer === 'threads'"
          id="thread-list-pane"
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
                ><strong>{{ board.label }}</strong
                ><span v-if="board.description">{{ board.description }}</span
                ><small v-if="board.stats">{{ board.stats }}</small></a
              >
            </div>
          </section>
          <nav
            v-if="boardFilterGroups.length"
            class="board-filters"
            :aria-label="text.boardFilters"
          >
            <div
              v-for="(group, index) in boardFilterGroups"
              :key="`${group.sourceId}:${index}`"
              role="group"
              :aria-label="group.label"
              class="board-filter-group"
            >
              <h2>{{ group.label }}</h2>
              <div class="board-filter-links">
                <a
                  v-for="filter in group.links"
                  :key="filter.url"
                  :href="filter.url"
                  >{{ filter.label }}</a
                >
              </div>
            </div>
          </nav>
          <ul :aria-label="text.criteria">
            <li
              v-for="criterion in boardContext.criteria"
              :key="criterion.label"
            >
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
          v-if="threadWithoutResults"
          v-show="(threadsDocked && !threadsCollapsed) || drawer === 'threads'"
          id="thread-list-pane"
          class="results-placeholder pane"
        >
          <h2>{{ text.threadResults }}</h2>
          <p>{{ text.chooseThreadContext }}</p>
          <a v-if="reading?.thread.parent" :href="reading.thread.parent.url">{{
            reading.thread.parent.label
          }}</a>
        </section>
      </Teleport>
      <div class="conversation-region">
        <section
          v-if="state.section === 'boards' && !reading && !state.privateReading"
          class="reader-placeholder pane"
        >
          <p>{{ text.chooseThreadContext }}</p>
        </section>
        <section
          v-if="pendingPrivate"
          class="reading-pane pane"
          :aria-label="text.privateContext"
        >
          <h1>{{ text.privateContext }}</h1>
          <p>{{ insert(text.privateRecipientId, privateRecipientId) }}</p>
          <p>{{ text.privateReadEffects }}</p>
          <p>{{ text.privateArrivalEffects }}</p>
          <button
            :disabled="state.loading"
            @click="workspace.openThread(state.destination)"
          >
            {{ text.loadPrivateConversation }}</button
          ><a :href="nativeDestination(state.destination)">{{ text.native }}</a>
        </section>
        <PrivateConversationView
          v-if="state.privateReading"
          :conversation="
            privateHistory.result?.conversation ??
            state.privateReading.conversation
          "
          :loading="privateHistory.loading"
          :failure="privateHistory.failure"
          :language="workspace.preferences.state.value.language"
          @load="workspace.privateHistory.load($event)"
        />
        <div v-if="reading" class="conversation-heading">
          <section class="thread-heading">
            <p class="eyebrow">{{ text.thread }} {{ reading.thread.id }}</p>
            <h1>{{ reading.thread.title }}</h1>
            <p v-if="!reading.thread.pages.links.length">
              {{ text.page }} {{ reading.thread.pages.current }}
            </p>
            <a v-if="reading.thread.parent" :href="reading.thread.parent.url">{{
              reading.thread.parent.label
            }}</a>
          </section>
          <div class="conversation-tool-row">
            <div ref="threadContextTools" class="thread-context-tools" />
            <button
              v-if="reading.thread.parent"
              @click="
                workspace.writing.prepareReply(
                  boardIdFrom(reading.thread.parent.url),
                  {
                    threadId: reading.thread.id,
                    postId: null,
                    author: '',
                    authorId: null,
                  },
                )
              "
            >
              {{ text.replyToThread }}
            </button>
          </div>
          <nav
            v-if="reading.thread.pages.links.length"
            class="thread-top-pages"
            :aria-label="text.threadPagesTop"
          >
            <span>{{ text.page }} {{ reading.thread.pages.current }}</span>
            <a
              v-for="link in reading.thread.pages.links"
              :key="link.url"
              :href="link.url"
              >{{ link.label }}</a
            >
          </nav>
          <nav :aria-label="text.threadFilters">
            <a
              v-for="filter in threadFilters.filter(
                (filter) => !filter.authorId,
              )"
              :key="filter.url"
              :href="filter.url"
              >{{ filter.label }}</a
            >
          </nav>
          <p v-if="missingTarget" role="alert">
            {{ insert(text.missingPost, reading.thread.target ?? "") }}
          </p>
          <p
            v-for="notice in reading.thread.notices"
            :key="notice"
            class="permission-notice"
          >
            {{ notice }}
          </p>
        </div>
        <section
          v-if="reading"
          class="reading-pane pane"
          data-scroll-pane="reading"
          :aria-label="text.threadReading"
          @scroll.passive="approachHistory"
        >
          <div class="history-controls" :aria-label="text.threadHistory">
            <template
              v-for="direction in ['earlier', 'later'] as const"
              :key="direction"
            >
              <button
                v-if="history[direction].url"
                :disabled="
                  history.earlier.status === 'loading' ||
                  history.later.status === 'loading'
                "
                @click="workspace.threadHistory.load(direction)"
              >
                {{
                  history[direction].status === "loading"
                    ? text.historyLoading
                    : direction === "earlier"
                      ? history[direction].status === "failed"
                        ? text.retryEarlier
                        : text.loadEarlier
                      : history[direction].status === "failed"
                        ? text.retryLater
                        : text.loadLater
                }}
              </button>
              <span v-else>{{
                history[direction].status === "end"
                  ? direction === "earlier"
                    ? text.historyBeginning
                    : text.historyEnd
                  : direction === "earlier"
                    ? text.historyEarlierUnknown
                    : text.historyLaterUnknown
              }}</span>
            </template>
            <a v-if="history.latest" :href="history.latest">{{
              text.jumpLatest
            }}</a>
            <p
              v-for="direction in ['earlier', 'later'] as const"
              v-show="history[direction].failure"
              :key="`failure-${direction}`"
              role="status"
            >
              {{
                history[direction].failure &&
                "message" in history[direction].failure
                  ? description(
                      history[direction].failure.message,
                      workspace.preferences.state.value.language,
                    )
                  : ""
              }}
            </p>
          </div>
          <article
            v-for="post in reading.thread.posts"
            :id="`pid${post.id}`"
            :key="post.id"
            :aria-label="`${text.post} ${post.id}`"
            :data-targeted="reading.thread.target === post.id"
            tabindex="-1"
          >
            <header class="post-header">
              <strong class="post-author">{{ post.author }}</strong>
              <div class="post-metadata">
                <span>{{ text.floor }} {{ post.floor || text.unknown }}</span>
                <time>{{ post.date }}</time>
                <a :href="post.url">{{ text.post }} {{ post.id }}</a>
              </div>
            </header>
            <ContentView
              :nodes="post.content"
              :language="workspace.preferences.state.value.language"
              summarize-formatting
            />
            <footer
              v-if="
                reading.thread.parent ||
                (reading.account.kind === 'member' &&
                  post.authorId === reading.account.id) ||
                threadFilters.some(
                  (filter) =>
                    filter.authorId === post.authorId &&
                    filter.authorId !== null,
                )
              "
              class="post-actions"
            >
              <button
                v-if="reading.thread.parent"
                @click="
                  workspace.writing.prepareReply(
                    boardIdFrom(reading.thread.parent.url),
                    {
                      threadId: reading.thread.id,
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
                  reading.account.kind === 'member' &&
                  post.authorId === reading.account.id
                "
                @click="
                  workspace.writing.prepareEdit(reading.thread.url, post.id)
                "
              >
                {{ insert(text.editPost, post.id) }}
              </button>
              <a
                v-for="filter in threadFilters.filter(
                  (filter) =>
                    filter.authorId === post.authorId &&
                    filter.authorId !== null,
                )"
                :key="filter.url"
                :href="filter.url"
                class="author-filter"
                >{{ filter.label }}</a
              >
            </footer>
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
              v-for="link in reading.thread.pages.links"
              :key="link.url"
              :href="link.url"
              >{{ link.label }}</a
            >
          </nav>
        </section>
        <div class="conversation-status">
          <div
            v-if="
              (writing.context && !writing.visible) ||
              writing.preparing ||
              writing.message ||
              writing.editReplacement ||
              writing.replacement ||
              writing.draftReplacement
            "
            class="writing-actions"
          >
            <button
              v-if="writing.context && !writing.visible"
              @click="workspace.writing.show()"
            >
              {{ text.returnWriting }}
            </button>
            <p v-if="writing.preparing" role="status">
              {{ text.preparingForm }}
            </p>
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
          <section
            v-if="writing.context && !writing.visible"
            class="retained-writing"
            :aria-label="text.retainedWriting"
          >
            <details>
              <summary>{{ text.retainedWriting }}</summary>
              <WritingDestination
                :writing="writing.context"
                :language="workspace.preferences.state.value.language"
                compact
              />
            </details>
            <p v-if="!writing.accountVerified" role="alert">
              {{
                insert(
                  writing.accountObservation.kind === "guest"
                    ? text.writingSignedOut
                    : writing.accountObservation.kind === "member" &&
                        writing.accountObservation.id !==
                          writing.context.account.id
                      ? text.writingAccountChanged
                      : text.writingPaused,
                  writing.context.account.name,
                )
              }}
            </p>
            <p v-if="writing.recoveryAvailable === false" role="alert">
              {{ text.writingRecoveryUnavailable }}
            </p>
            <p
              v-if="workspace.writing.unresolvedAttachments.value.length"
              role="alert"
            >
              {{
                insert(
                  text.unresolvedAttachments,
                  workspace.writing.unresolvedAttachments.value.join(", "),
                )
              }}
            </p>
            <p v-if="retainedAttemptWarning" role="alert">
              {{ text.retainedAttemptWarning }}
            </p>
            <p v-if="writing.conflict" role="alert">
              {{ text.latestServerVersion }}. {{ text.editCompare }}
            </p>
            <p v-if="writing.context.editorUnresolved" role="alert">
              {{
                editorText(
                  "Some visual input has no unambiguous BBCode representation. Complete source is retained. Review it before choosing how it should be interpreted.",
                  workspace.preferences.state.value.language,
                )
              }}
            </p>
            <p
              v-if="
                writing.context.redPacket || writing.context.existingRedPacket
              "
              role="alert"
            >
              {{ text.retainedFinancialWarning }}
            </p>
          </section>
        </div>
        <SourceWriting
          v-if="writing.context"
          v-show="writing.visible"
          :key="writing.context.id"
          :workspace="workspace"
          :expanded="writingExpanded"
          @resize="resizeWriting"
        />
      </div>
    </main>
  </div>
</template>
