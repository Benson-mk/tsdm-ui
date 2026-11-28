<script setup lang="ts">
import ReplyRecoveryDialog from "../components/ReplyRecoveryDialog.vue";
import BoardWritingActions from "../components/BoardWritingActions.vue";
import type { ViewPosition } from "../workspace/navigation";
import {
  computed,
  ref,
  useId,
  onMounted,
  onUnmounted,
  watch,
  nextTick,
  type DeepReadonly,
} from "vue";
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  CollapsibleRoot,
  CollapsibleTrigger,
  CollapsibleContent,
} from "reka-ui";
import ColumnSeparator from "../components/ColumnSeparator.vue";
import PostActions from "../components/PostActions.vue";
import PostPermalink from "../components/PostPermalink.vue";
import ThreadTools from "../components/ThreadTools.vue";
import ThreadHistoryBoundary from "../components/ThreadHistoryBoundary.vue";
import WorkspaceIcon from "../components/WorkspaceIcon.vue";
import WorkspaceBrand from "../components/WorkspaceBrand.vue";
import SearchView from "../components/SearchView.vue";
import { favoriteText } from "../components/favorite-labels";
import FavoritesView from "../components/FavoritesView.vue";
import MessagesView from "../components/MessagesView.vue";
import { privateWritingText } from "../components/private-writing-text";
import PrivateConversationView from "../components/PrivateConversationView.vue";
import NoticesView from "../components/NoticesView.vue";
import DestinationLoadStatus from "../components/DestinationLoadStatus.vue";
import SourceWriting from "../components/SourceWriting.vue";
import ReplySends from "../components/ReplySends.vue";
import WritingDestination from "../components/WritingDestination.vue";
import { editorText } from "../components/editor-strings";
import ContentView from "../components/ContentView";
import SettingsDialog from "../components/SettingsDialog.vue";
import type { Workspace } from "../workspace";
import { describeDestination, type Directory } from "../forum-client";
import { sourceGroupKey, groupCategory, boardCategory } from "./board-groups";
import { nativeDestination } from "../hosts/browser";
import { strings, insert, description } from "./strings";
import type { Section } from "../workspace/navigation";
const props = defineProps<{ workspace: Workspace; portal: HTMLElement }>();
const state = props.workspace.state;
const history = props.workspace.threadHistory.state;
const boardChecks = props.workspace.boardChecks.state;
const privateHistory = props.workspace.privateHistory.state;
const writing = props.workspace.writing.state;
const privateRecipientId = computed(
  () => new URL(state.value.destination).searchParams.get("touid") ?? "",
);
const noticeEffectsId = useId();
const privateArrivalEffectsId = useId();
const searchEffectsId = useId();
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
const reverseReading = computed(
  () => reading.value?.thread.history?.order === "descending",
);
const visiblePosts = computed(() =>
  reverseReading.value
    ? [...(reading.value?.thread.posts ?? [])].reverse()
    : (reading.value?.thread.posts ?? []),
);
const newestReplyId = computed(() => {
  const posts = visiblePosts.value;
  if (!reverseReading.value) return posts.at(-1)?.id;
  const first = posts.findIndex(
    (post) => !/^(?:-1)?#$/.test(post.floor.trim()),
  );
  // Only the observed native pinned prefix is skipped, and only when the next
  // post has a positive native floor. Unknown labels keep source order intact.
  return (
    first >= 0 && /^[1-9]\d*#?$/.test(posts[first]!.floor.trim())
      ? posts[first]
      : posts[0]
  )?.id;
});
const postMenus = new Map<string, InstanceType<typeof PostActions>>();
const boardsCollapsed = ref(false);
const threadsCollapsed = ref(false);
const paneWidth = ref(window.innerWidth);
const boardsDocked = computed(() => paneWidth.value >= 960);
const threadsDocked = computed(() => paneWidth.value >= 768);
const narrowBrowsing = ref(false);
const primaryThreadsKey = ref<string | null>(null);
const primaryThreadsList = computed(
  () => !boardsDocked.value && primaryThreadsKey.value === state.value.key,
);
const directorySelected = computed(
  () =>
    state.value.section === "boards" &&
    state.value.result?.kind === "directory",
);
const personalCanvas = computed(() => state.value.section !== "boards");
const standaloneTaskReader = computed(
  () =>
    personalCanvas.value &&
    state.value.result?.kind === "thread" &&
    (!boardsDocked.value || !state.value.selection),
);
const browsingCanvas = computed(
  () => directorySelected.value || primaryThreadsList.value,
);
const canvasWritingKey = ref<string | null>(null);
const writingOnCanvas = computed(
  () =>
    browsingCanvas.value &&
    canvasWritingKey.value === state.value.key &&
    writing.value.visible,
);
const hasReader = computed(
  () => !!reading.value || !!state.value.privateReading || pendingPrivate.value,
);
const hasConversation = computed(
  () => hasReader.value || !!(writing.value.context && writing.value.visible),
);
const resultsVisible = computed(() =>
  standaloneTaskReader.value
    ? false
    : browsingCanvas.value
      ? !writingOnCanvas.value
      : threadsDocked.value
        ? !threadsCollapsed.value || !hasConversation.value
        : !hasConversation.value || narrowBrowsing.value,
);
const sectionResultsVisible = computed(
  () => resultsVisible.value && !primaryThreadsList.value,
);
const browseOnly = computed(() =>
  browsingCanvas.value
    ? !writingOnCanvas.value
    : !hasConversation.value &&
      !(
        threadsDocked.value &&
        !personalCanvas.value &&
        state.value.result?.kind === "board"
      ),
);
const conversationVisible = computed(
  () =>
    writingOnCanvas.value ||
    (!browseOnly.value && (threadsDocked.value || !resultsVisible.value)),
);
const browsingWritingStatus = ref<HTMLElement | null>(null);
type DrawerPane = "boards" | "threads";
const drawer = ref<DrawerPane | null>(null);
const drawerContent = ref<HTMLElement | null>(null);
const drawerClose = ref<HTMLButtonElement | null>(null);
const boardContextTools = ref<HTMLElement | null>(null);
const contextTools = computed(() => boardContextTools.value);
const boardsTrigger = ref<HTMLButtonElement | null>(null);
const threadsTrigger = ref<HTMLButtonElement | null>(null);
const mainDestinationsTrigger = ref<HTMLButtonElement | null>(null);
const moreTrigger = ref<HTMLButtonElement | null>(null);
const primaryNavigation = ref<HTMLElement | null>(null);
const settings = ref<InstanceType<typeof SettingsDialog> | null>(null);
const destinationsOpen = ref(false);
const showingAccount = ref(false);
const accountHeading = ref<HTMLElement | null>(null);
let settingsFromDestinations = false;
function focusDestinationsTrigger() {
  (boardsDocked.value
    ? mainDestinationsTrigger.value
    : moreTrigger.value
  )?.focus({ preventScroll: true });
}
function changeDestinations(open: boolean) {
  const change = () => {
    destinationsOpen.value = open;
    showingAccount.value = false;
    if (!open) void nextTick().then(focusDestinationsTrigger);
  };
  if (!props.workspace.writing.deferViewChange(change)) change();
}
function showAccount() {
  showingAccount.value = true;
  void nextTick().then(() =>
    accountHeading.value?.focus({ preventScroll: true }),
  );
}
function openDestinationSettings() {
  const change = () => {
    settingsFromDestinations = true;
    destinationsOpen.value = false;
    void nextTick().then(() => settings.value?.show());
  };
  if (!props.workspace.writing.deferViewChange(change)) change();
}
const paneScroll = new Map<HTMLElement, number>();
const paneRows = new Map<
  HTMLElement,
  {
    row: HTMLElement;
    offset: number;
    fallback?: { row: HTMLElement; offset: number };
  }
>();
let drawerReturnFocus: HTMLButtonElement | null = null;
function rememberPaneScroll() {
  for (const pane of workspaceHost().shadowRoot?.querySelectorAll<HTMLElement>(
    ".pane",
  ) ?? [])
    if (pane.getClientRects().length) {
      paneScroll.set(pane, pane.scrollTop);
      const top = pane.getBoundingClientRect().top;
      const row = pane.classList.contains("board-thread-list")
        ? [...pane.querySelectorAll<HTMLElement>("[data-thread-id]")].find(
            (row) => row.getBoundingClientRect().bottom > top + 1,
          )
        : undefined;
      if (row)
        paneRows.set(pane, {
          row,
          offset: row.getBoundingClientRect().top - top,
        });
      else paneRows.delete(pane);
    }
}
function restorePaneScroll() {
  for (const [pane, top] of paneScroll) {
    if (!pane.isConnected) {
      paneScroll.delete(pane);
      paneRows.delete(pane);
    } else if (
      pane.getClientRects().length &&
      !pane.classList.contains("reading-pane")
    ) {
      pane.scrollTop = top;
      let anchor = paneRows.get(pane);
      let promoted: PanePosition | undefined;
      if (
        anchor?.fallback?.row.isConnected &&
        anchor.row.getBoundingClientRect().height + anchor.offset <= 1
      ) {
        // A heavily clipped row may shrink entirely above the viewport. Keep
        // the previously complete row in place instead of saving an invisible
        // anchor and drifting on the return resize.
        anchor = anchor.fallback;
        paneRows.set(pane, anchor);
        promoted = viewportPositions.find((position) => position.pane === pane);
        if (promoted) {
          promoted.anchor = anchor.row;
          promoted.offset = anchor.offset + promoted.paneTop;
          delete promoted.fallback;
        }
      }
      if (anchor?.row.isConnected && pane.contains(anchor.row))
        pane.scrollTop +=
          anchor.row.getBoundingClientRect().top -
          pane.getBoundingClientRect().top -
          anchor.offset;
      if (promoted) promoted.scrollTop = pane.scrollTop;
    }
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
    else {
      const target = drawerReturnFocus?.isConnected
        ? drawerReturnFocus
        : workspaceHost().shadowRoot?.querySelector<HTMLElement>(".brand");
      target?.focus({ preventScroll: true });
    }
    appearanceAnchors = [];
    rememberPositions();
  });
}
// Settings temporarily replaces the Boards modal rather than stacking traps.
let focusSettingsOnDrawerOpen = false;
function settingsOpenChanged(open: boolean) {
  if (!open) return;
  if (drawer.value === "boards") {
    rememberPaneScroll();
    drawer.value = null;
  }
}
function settingsFocusReturn(event: Event) {
  event.preventDefault();
  if (settingsFromDestinations) {
    settingsFromDestinations = false;
    void nextTick().then(focusDestinationsTrigger);
    return;
  }
  if (boardsDocked.value) boardsCollapsed.value = false;
  else {
    focusSettingsOnDrawerOpen = true;
    drawer.value = "boards";
  }
  void nextTick().then(() => {
    restorePaneScroll();
    workspaceHost()
      .shadowRoot?.querySelector<HTMLElement>(".navigation-settings")
      ?.focus({ preventScroll: true });
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
  if (focusSettingsOnDrawerOpen) {
    focusSettingsOnDrawerOpen = false;
    workspaceHost()
      .shadowRoot?.querySelector<HTMLElement>(".navigation-settings")
      ?.focus({ preventScroll: true });
  } else drawerClose.value?.focus({ preventScroll: true });
}
function closeDrawer() {
  const change = () => changeDrawer(null);
  if (!props.workspace.writing.deferViewChange(change)) change();
}
function togglePane(pane: DrawerPane) {
  const change = () => {
    if (pane === "threads" && primaryThreadsList.value) {
      primaryThreadsKey.value = null;
      narrowBrowsing.value = false;
      void nextTick().then(restorePaneScroll);
      return;
    }
    if (pane === "threads" && !threadsDocked.value) {
      if (!resultsVisible.value)
        browsingReaderPosition = capturePositions().filter(({ pane }) =>
          pane.classList.contains("reading-pane"),
        );
      rememberPositions();
      rememberPaneScroll();
      narrowBrowsing.value = hasConversation.value
        ? !narrowBrowsing.value
        : true;
      if (drawer.value) changeDrawer(null);
      void nextTick().then(() => {
        restorePaneScroll();
        rememberPositions();
      });
      return;
    }
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
// A narrow result view hides, rather than remounts, the retained reader.
// Capture before Vue changes visibility; later navigation snapshots can describe
// the new list and must not overwrite this reader's visible anchor.
let browsingReaderPosition: PanePosition[] = [];
watch(resultsVisible, (visible, previous) => {
  if (threadsDocked.value) return;
  rememberPaneScroll();
  void nextTick().then(restorePaneScroll);
  if (visible && !previous) {
    if (!browsingReaderPosition.length)
      browsingReaderPosition = capturePositions().filter(({ pane }) =>
        pane.classList.contains("reading-pane"),
      );
  } else if (!visible && previous) {
    void nextTick().then(() => {
      restorePositions(browsingReaderPosition);
      browsingReaderPosition = [];
      rememberPositions();
    });
  }
});
function revealResults() {
  threadsCollapsed.value = false;
  narrowBrowsing.value = true;
  if (drawer.value) changeDrawer(null);
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
        ((!previous ||
          ((result.kind === "board" || result.kind === "directory") &&
            result !== previous)) &&
          !reading.value &&
          !state.value.privateReading)
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
  () => [state.value.key, state.value.result] as const,
  ([key, result], [previousKey, previousResult]) => {
    // An accepted cached navigation can reuse the identical reading result.
    // A new navigation key still selects its reader; a pending writing guard
    // changes neither key nor result and therefore cannot hide the results.
    if (
      (key !== previousKey || result !== previousResult) &&
      (result?.kind === "thread" || result?.kind === "private-conversation")
    ) {
      narrowBrowsing.value = false;
      if (drawer.value === "threads") changeDrawer(null);
    }
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
  "messages",
  "search",
  "saved",
  "notices",
  "drafts",
];
const secondarySections: Section[] = ["search", "saved", "notices", "drafts"];
const currentPrimaryDestination = computed(() =>
  primaryThreadsList.value
    ? "threads"
    : state.value.section === "boards"
      ? directorySelected.value
        ? "boards"
        : "threads"
      : state.value.section === "messages"
        ? "messages"
        : "more",
);
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
    primaryThreadsKey.value = null;
    if (destinationsOpen.value) changeDestinations(false);
    if (section === "boards") {
      if (state.value.result?.kind === "directory") {
        canvasWritingKey.value = null;
        if (drawer.value) changeDrawer(null);
        return;
      }
      rememberBrowsingReader();
      void props.workspace.openSection(section);
      return;
    }
    const positions = capturePositions();
    revealResults();
    void nextTick().then(() => restorePositions(positions, true));
    void props.workspace.openSection(section);
  };
  if (!props.workspace.writing.deferViewChange(change)) change();
}
function selectPrimaryThreads() {
  const change = () => {
    rememberBrowsingReader();
    rememberPaneScroll();
    if (!boardResultsAvailable.value)
      props.workspace.openRetainedBoardResults();
    primaryThreadsKey.value = state.value.key;
    canvasWritingKey.value = null;
    revealResults();
    void nextTick().then(restorePaneScroll);
  };
  if (!props.workspace.writing.deferViewChange(change)) change();
}
function resumeCanvasWriting() {
  canvasWritingKey.value = state.value.key;
  props.workspace.writing.show();
}
type PanePosition = {
  fallback?: { anchor: HTMLElement; offset: number };
  range?: Range | undefined;
  pane: HTMLElement;
  anchor: HTMLElement;
  offset: number;
  paneTop: number;
  scrollTop: number;
};
let viewportPositions: RestoredAnchor[] = [];
type RestoredAnchor = PanePosition;
let appearanceAnchors: RestoredAnchor[] = [];
let readingRestoreRevision = 0;
let viewportWidth = window.innerWidth;
let viewportHeight = window.innerHeight;
const workspaceHost = () =>
  (props.portal.getRootNode() as ShadowRoot).host as HTMLElement;
function visibleReadingRange(pane: HTMLElement): Range | undefined {
  const bounds = pane.getBoundingClientRect();
  for (const content of pane.querySelectorAll(".post-content")) {
    const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      if (!node.textContent?.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      if (
        ![...range.getClientRects()].some(
          (rect) =>
            rect.width > 0 &&
            rect.top >= bounds.top &&
            rect.bottom <= bounds.bottom,
        )
      )
        continue;
      // Find a character on the first complete visible line without scanning
      // every character of a long native post on each scroll event.
      let low = 0,
        high = node.textContent.length - 1;
      while (low < high) {
        const middle = Math.floor((low + high) / 2);
        range.setStart(node, middle);
        range.setEnd(node, middle + 1);
        if (range.getBoundingClientRect().top < bounds.top) low = middle + 1;
        else high = middle;
      }
      for (let offset = low; offset < node.textContent.length; offset++) {
        range.setStart(node, offset);
        range.setEnd(node, offset + 1);
        const rect = range.getBoundingClientRect();
        if (
          rect.width > 0 &&
          rect.height > 0 &&
          rect.top >= bounds.top &&
          rect.bottom <= bounds.bottom
        )
          return range;
        // Collapsed native whitespace has zero area. It is not an anchor;
        // keep looking on this line rather than discarding the text node.
        if (rect.height > 0 && rect.top >= bounds.bottom) break;
      }
    }
  }
}
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
        position.scrollTop === pane.scrollTop &&
        // Another presentation change may reflow content without scrolling.
        // Only reuse a range whose prior restoration still describes the view.
        [position.offset, position.offset + bounds.top - position.paneTop].some(
          (top) =>
            Math.abs(
              (position.range ?? position.anchor).getBoundingClientRect().top -
                top,
            ) <= 1,
        ),
    );
    const visible = (node: HTMLElement) =>
      node.getBoundingClientRect().bottom > bounds.top + 1 &&
      node.getBoundingClientRect().top < bounds.bottom;
    const range = previous
      ? previous.range
      : pane.classList.contains("reading-pane")
        ? visibleReadingRange(pane)
        : undefined;
    const anchor =
      previous?.anchor ??
      range?.startContainer.parentElement ??
      [
        ...pane.querySelectorAll<HTMLElement>(
          ".post-content p, .post-content pre, .post-content .table-overflow, .post-content summary, .thread-row, .board-card, .board-group > h2, .thread-heading",
        ),
      ].find(visible) ??
      // Native posts need not contain paragraph elements. Keep their existing
      // rendered body as the fallback anchor rather than losing div/text-only
      // content when the reader is temporarily hidden.
      [...pane.querySelectorAll<HTMLElement>(".post-content")].find(visible);
    const completeRow = pane.classList.contains("board-thread-list")
      ? [...pane.querySelectorAll<HTMLElement>("[data-thread-id]")].find(
          (row) => {
            const rect = row.getBoundingClientRect();
            return (
              rect.height > 0 &&
              rect.top >= bounds.top &&
              rect.bottom <= bounds.bottom
            );
          },
        )
      : undefined;
    return anchor
      ? [
          {
            pane,
            anchor,
            ...(anchor.classList.contains("thread-row") &&
            completeRow &&
            completeRow !== anchor
              ? {
                  fallback: {
                    anchor: completeRow,
                    offset:
                      completeRow.getBoundingClientRect().top -
                      bounds.top +
                      (previous?.paneTop ?? bounds.top),
                  },
                }
              : {}),
            range,
            offset:
              previous?.offset ?? (range ?? anchor).getBoundingClientRect().top,
            paneTop: previous?.paneTop ?? bounds.top,
            scrollTop: pane.scrollTop,
          },
        ]
      : [];
  });
}
let readingSaveTimer: ReturnType<typeof setTimeout> | undefined;
function saveReadingPosition() {
  if (readingSaveTimer) clearTimeout(readingSaveTimer);
  readingSaveTimer = setTimeout(
    () => props.workspace.saveReadingPosition(),
    150,
  );
}
function rememberPositions() {
  scheduleReadingPage();
  if (
    window.innerWidth !== viewportWidth ||
    window.innerHeight !== viewportHeight
  )
    return;
  const current = capturePositions(viewportPositions).map((position) => ({
    ...position,
    scrollTop: position.pane.scrollTop,
  }));
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
  for (const { pane, anchor, range, offset, paneTop, scrollTop } of positions) {
    if (!anchor.isConnected || !pane.getClientRects().length) continue;
    if (pane.classList.contains("reading-pane"))
      restoreReadingHeading(scrollTop);
    const bounds = pane.getBoundingClientRect();
    const anchorRect = (
      range?.startContainer.isConnected ? range : anchor
    ).getBoundingClientRect();
    const anchorTop = anchorRect.top;
    let target = offset + (relativeToPane ? bounds.top - paneTop : 0);
    let bottomLimit: number | undefined;
    if (
      range?.startContainer.isConnected &&
      pane.classList.contains("reading-pane")
    ) {
      const outer = pane
        .closest(".conversation-region")!
        .getBoundingClientRect();
      const top = Math.max(0, bounds.top, outer.top);
      const bottom = Math.min(window.innerHeight, bounds.bottom, outer.bottom);
      bottomLimit = bottom;
      // Keep the screen coordinate only while the complete glyph still fits.
      // Growing headings can cover that coordinate; preserve the original
      // reader-relative offset instead, bounded by the actual visible region.
      if (target < top || target + anchorRect.height > bottom)
        target = Math.max(
          top,
          Math.min(bottom - anchorRect.height, top + offset - paneTop),
        );
    }
    pane.scrollTop += anchorTop - target;
    // Integer scrollTop rounding must not clip the final fraction of a glyph
    // when a shorter reader places it against the bottom edge.
    if (bottomLimit !== undefined && range?.startContainer.isConnected) {
      const clipped = range.getBoundingClientRect().bottom - bottomLimit;
      if (clipped > 0 && clipped < 1) pane.scrollTop += Math.ceil(clipped);
    }
  }
}
function closeCheckDetails(event: KeyboardEvent) {
  const details = event.currentTarget as HTMLDetailsElement;
  details.open = false;
  details.querySelector("summary")?.focus({ preventScroll: true });
}

// Status changes may reflow content above the viewport. Keep a mid-scroll
// anchor, but leave the top at zero so new status is discoverable there.
watch(
  () => [
    boardChecks.value.checking,
    boardChecks.value.failure,
    boardChecks.value.arrivals.length,
    props.workspace.boardChecks.canCheck(),
    history.value.checking,
    history.value.refreshFailure,
    history.value.arrivals.length,
    history.value.earlier.status,
    history.value.later.status,
  ],
  () => {
    const revision = readingRestoreRevision;
    const context = state.value.key;
    const title = titlePosition;
    const positions = capturePositions().filter(
      ({ pane, scrollTop }) =>
        (pane.classList.contains("board-thread-list") ||
          pane.classList.contains("reading-pane")) &&
        scrollTop > 0,
    );
    void nextTick().then(() => {
      // Workspace restoration/follow owns a changed result or navigation.
      if (revision !== readingRestoreRevision || context !== state.value.key)
        return;
      const displaced = positions.filter(
        ({ anchor, range, offset }) =>
          anchor.isConnected &&
          Math.abs(
            (range?.startContainer.isConnected
              ? range
              : anchor
            ).getBoundingClientRect().top - offset,
          ) > 0.5,
      );
      if (displaced.length) {
        const retainTitle =
          title &&
          title === titlePosition &&
          title.scroll === title.pane.scrollTop;
        restorePositions(displaced);
        // Compaction records the original user scroll intent. A status-only
        // compensation must not reclassify its distance from the newest post.
        if (retainTitle) title.scroll = title.pane.scrollTop;
      }
    });
  },
);

function resize() {
  const viewport = window.visualViewport;
  const magnified =
    viewport && Number.isFinite(viewport.scale) && viewport.scale > 1;
  if (
    magnified &&
    window.innerWidth === viewportWidth &&
    window.innerHeight === viewportHeight
  )
    return;
  const height = magnified
    ? window.innerHeight
    : viewport?.scale === 1
      ? viewport.height
      : undefined;
  const top = viewport?.scale === 1 ? viewport.offsetTop : 0;
  const host = workspaceHost();
  host.style.setProperty(
    "--view-height",
    height && Number.isFinite(height) && height > 0
      ? `${height}px`
      : CSS.supports("height", "100dvh")
        ? "100dvh"
        : "100vh",
  );
  host.style.setProperty(
    "--view-top",
    top !== undefined && Number.isFinite(top) && top >= 0 ? `${top}px` : "0px",
  );
  host.style.top = "var(--view-top)";
  host.style.height = "var(--view-height)";
  host.style.bottom = "auto";
  const positions = viewportPositions;
  const revision = readingRestoreRevision;
  const active = host.shadowRoot?.activeElement;
  const focusPrimaryNavigation =
    active !== null &&
    (active === mainDestinationsTrigger.value ||
      !!primaryNavigation.value?.contains(active ?? null));
  const crossedPrimaryBreakpoint =
    boardsDocked.value !== window.innerWidth >= 960;
  appearanceAnchors = [];
  rememberPaneScroll();
  // Carry the pre-reflow row through a responsive hide/show as well as a
  // visible resize. The fallback is considered only if that row disappears.
  for (const position of positions) {
    if (position.pane.classList.contains("board-thread-list"))
      paneRows.set(position.pane, {
        row: position.anchor,
        offset: position.offset - position.paneTop,
        ...(position.fallback
          ? {
              fallback: {
                row: position.fallback.anchor,
                offset: position.fallback.offset - position.paneTop,
              },
            }
          : {}),
      });
  }
  paneWidth.value = window.innerWidth;
  if (
    drawer.value &&
    (drawer.value === "boards" ? boardsDocked.value : threadsDocked.value)
  )
    changeDrawer(null);
  void nextTick().then(() => {
    // A later history restoration owns both panes; stale resize work must not
    // replace their positions with the newly mounted panes' pre-restore offsets.
    if (revision === readingRestoreRevision) {
      restorePaneScroll();
      // The browser has already reflowed CSS when resize fires. Its fresh pane
      // measurement cannot recover the old row offset; use the last observed
      // visible board anchor, just as the reader uses its pre-resize position.
      restorePositions(
        positions.filter(
          ({ pane }) =>
            pane.classList.contains("reading-pane") ||
            pane.classList.contains("board-thread-list"),
        ),
        true,
      );
    }
    // A restored scroll event must keep the exact character across successive
    // widths. Recapturing the start of its newly wrapped line drifts on return.
    viewportPositions = positions.map((position) => ({
      ...position,
      scrollTop: position.pane.scrollTop,
    }));
    // Resize may clip the still-focused source without a new focus event.
    // Scroll its existing node; focusing it again would disturb composition.
    const focused = host.shadowRoot?.activeElement;
    if (crossedPrimaryBreakpoint && focusPrimaryNavigation)
      focusDestinationsTrigger();
    if (
      !magnified &&
      focused instanceof HTMLElement &&
      focused.closest(".source-writing")
    )
      focused.scrollIntoView({ block: "nearest", inline: "nearest" });
    rememberPositions();
  });
  viewportWidth = window.innerWidth;
  viewportHeight = window.innerHeight;
}
watch(() => [state.value.result, state.value.section], rememberPositions, {
  flush: "post",
});
onMounted(() => {
  resize();
  rememberPositions();
  workspaceHost().shadowRoot!.addEventListener(
    "scroll",
    rememberPositions,
    true,
  );
  workspaceHost().shadowRoot!.addEventListener(
    "scroll",
    saveReadingPosition,
    true,
  );
  window.addEventListener("pagehide", props.workspace.saveReadingPosition);
  window.addEventListener("resize", resize);
  window.visualViewport?.addEventListener("resize", resize);
  window.visualViewport?.addEventListener("scroll", resize);
});
onUnmounted(() => {
  workspaceHost().shadowRoot!.removeEventListener(
    "scroll",
    rememberPositions,
    true,
  );
  if (readingSaveTimer) clearTimeout(readingSaveTimer);
  workspaceHost().shadowRoot!.removeEventListener(
    "scroll",
    saveReadingPosition,
    true,
  );
  window.removeEventListener("pagehide", props.workspace.saveReadingPosition);
  window.removeEventListener("resize", resize);
  window.visualViewport?.removeEventListener("resize", resize);
  window.visualViewport?.removeEventListener("scroll", resize);
});
watch(
  props.workspace.preferences.state,
  () => {
    const host = workspaceHost();
    // Retain the same character, but use this action's actual coordinates.
    // A prior clipped fallback must not restore an older screen baseline when
    // the next typography change makes that older coordinate visible again.
    const positions = capturePositions(
      appearanceAnchors.length ? appearanceAnchors : viewportPositions,
    ).map((position) => ({
      ...position,
      offset: (position.range ?? position.anchor).getBoundingClientRect().top,
      paneTop: position.pane.getBoundingClientRect().top,
    }));
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
      // Typography owns a screen coordinate; a subsequent viewport action
      // starts from the resulting pane-relative coordinate of that same glyph.
      viewportPositions = positions.map((position) => ({
        ...position,
        offset: (position.range ?? position.anchor).getBoundingClientRect().top,
        paneTop: position.pane.getBoundingClientRect().top,
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
const writingExpanded = ref(false);
const conversationRegion = ref<HTMLElement | null>(null);
const conversationWidth = ref(0);
type Column = "boards" | "threads" | "writing";
const defaultWidths = { boards: 216, threads: 300, writing: 420 };
const desiredWidths = ref({ ...defaultWidths });
const boardsResizable = computed(
  () => boardsDocked.value && !boardsCollapsed.value,
);
const threadsResizable = computed(
  () =>
    threadsDocked.value && resultsVisible.value && conversationVisible.value,
);
const columnBounds = computed(() => {
  const writingMinimum =
    !["reply", "quick-quote"].includes(writing.value.context?.action ?? "") &&
    writing.value.visible &&
    writingExpanded.value &&
    paneWidth.value >= 1440
      ? 280
      : 0;
  const remainingMinimum = conversationVisible.value
    ? 320 + writingMinimum
    : 220;
  const boardsMaximum = Math.max(
    160,
    Math.min(
      360,
      paneWidth.value - (threadsResizable.value ? 220 : 0) - remainingMinimum,
    ),
  );
  const boards = boardsResizable.value
    ? Math.min(desiredWidths.value.boards, boardsMaximum)
    : 0;
  const threadsMaximum = Math.max(
    220,
    Math.min(520, paneWidth.value - boards - remainingMinimum),
  );
  const threads = threadsResizable.value
    ? Math.min(desiredWidths.value.threads, threadsMaximum)
    : 0;
  const writingMaximum = Math.max(
    280,
    Math.min(640, paneWidth.value - boards - threads - 320),
  );
  return {
    boards: { value: boards, minimum: 160, maximum: boardsMaximum },
    threads: { value: threads, minimum: 220, maximum: threadsMaximum },
    writing: {
      value: Math.min(desiredWidths.value.writing, writingMaximum),
      minimum: 280,
      maximum: writingMaximum,
    },
  };
});
const columnStyle = computed(() => ({
  gridTemplateColumns: [
    ...(boardsResizable.value ? [`${columnBounds.value.boards.value}px`] : []),
    ...(threadsResizable.value
      ? [`${columnBounds.value.threads.value}px`]
      : []),
    "minmax(0, 1fr)",
  ].join(" "),
  "--writer-width": `${columnBounds.value.writing.value}px`,
}));
const resizingColumns = ref(false);
let columnPositions: PanePosition[] = [];
let originalWidths = { ...defaultWidths };
function beginColumnResize() {
  resizingColumns.value = true;
  columnPositions = capturePositions();
  originalWidths = { ...desiredWidths.value };
  suppressAutomaticHistory();
}
function settleColumnResize() {
  const positions = columnPositions;
  const revision = readingRestoreRevision;
  void nextTick().then(() => {
    if (revision === readingRestoreRevision) restorePositions(positions, true);
    rememberPositions();
  });
}
function setColumnWidth(column: Column, value: number) {
  suppressAutomaticHistory();
  desiredWidths.value = { ...desiredWidths.value, [column]: value };
  settleColumnResize();
}
function endColumnResize(cancelled: boolean) {
  resizingColumns.value = false;
  if (cancelled) desiredWidths.value = { ...originalWidths };
  settleColumnResize();
}
function resetColumns() {
  beginColumnResize();
  desiredWidths.value = { ...defaultWidths };
  endColumnResize(false);
}
const writingWide = computed(
  () =>
    !["reply", "quick-quote"].includes(writing.value.context?.action ?? "") &&
    writing.value.visible &&
    writingExpanded.value &&
    paneWidth.value >= 1440 &&
    conversationWidth.value >= 600,
);
// The measured aside threshold can settle after the browser resize event.
// Preserve the same character when that second layout transition actually occurs.
watch(
  writingWide,
  () => {
    const positions = viewportPositions.filter(({ pane }) =>
      pane.classList.contains("reading-pane"),
    );
    const revision = readingRestoreRevision;
    void nextTick().then(() => {
      if (revision !== readingRestoreRevision) return;
      restorePositions(positions, true);
      viewportPositions = positions.map((position) => ({
        ...position,
        scrollTop: position.pane.scrollTop,
      }));
      rememberPositions();
    });
  },
  { flush: "post" },
);
const writingElsewhere = computed(() => {
  const context = writing.value.context;
  if (!context) return false;
  if (context.action === "private-message")
    return (
      !!reading.value ||
      (!!state.value.privateReading &&
        state.value.privateReading.conversation.peerId !== context.recipient.id)
    );
  const target = context.replyTarget?.threadId ?? context.editTarget?.threadId;
  return (
    !!state.value.privateReading ||
    (!!reading.value && target !== reading.value.thread.id)
  );
});
const ownsHiddenReply = computed(() => {
  const context = writing.value.context;
  return (
    !writing.value.visible &&
    !!context?.replyTarget &&
    context.replyTarget.threadId === reading.value?.thread.id
  );
});
const resumeReply = computed(() => {
  const threadId = reading.value?.thread.id;
  return (
    ownsHiddenReply.value &&
    !!threadId &&
    props.workspace.writing.localReplyThreads.value.includes(threadId)
  );
});
const replyEntry = ref<HTMLButtonElement | null>(null);
function parkReply() {
  props.workspace.writing.parkReply();
  void nextTick().then(() => replyEntry.value?.focus({ preventScroll: true }));
}
let conversationObserver: ResizeObserver | undefined;
onMounted(() => {
  conversationObserver = new ResizeObserver(() => {
    conversationWidth.value = conversationRegion.value?.clientWidth ?? 0;
  });
  if (conversationRegion.value)
    conversationObserver.observe(conversationRegion.value);
});
onUnmounted(() => conversationObserver?.disconnect());
watch(
  () => writing.value.context?.id,
  () => {
    const context = writing.value.context;
    writingExpanded.value = Boolean(
      context && context.action !== "private-message" && !context.replyTarget,
    );
    if (context) {
      narrowBrowsing.value = false;
      if (drawer.value) changeDrawer(null);
    }
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
const boardResultsAvailable = computed(
  () =>
    !!boardContext.value &&
    (state.value.section === "boards" || state.value.result?.kind === "board"),
);
const pinsExpanded = ref(false);
const boardAboutOpen = ref(false);
const pinnedRows = computed(
  () => boardContext.value?.threads.filter((row) => row.pinned) ?? [],
);
watch(
  () => boardContext.value?.url,
  () => {
    pinsExpanded.value = false;
    boardAboutOpen.value = false;
  },
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
      (group.sourceId === "filter_reward_menu"
        ? text.value.filterReward
        : undefined) ||
      {
        category: text.value.filterCategory,
        order: text.value.filterOrder,
        type: text.value.filterType,
        time: text.value.filterTime,
        unclassified: text.value.filterOther,
      }[group.kind],
  }));
});
const filtersOpen = ref(false);
const filterTrigger = ref<HTMLButtonElement | null>(null);
const pendingFilterURL = ref<string | null>(null);
const pendingFilterName = ref("");
function chooseFilter(url: string, name: string) {
  pendingFilterURL.value = url;
  pendingFilterName.value = name;
}
const pendingFilter = computed(() =>
  boardContext.value?.filterChoices?.find(
    (choice) => choice.url === pendingFilterURL.value,
  ),
);
function openFilters() {
  pendingFilterURL.value = null;
  pendingFilterName.value = "";
  filtersOpen.value = true;
}
function returnFilterFocus() {
  const target = filterTrigger.value?.getClientRects().length
    ? filterTrigger.value
    : threadsTrigger.value;
  target?.focus({ preventScroll: true });
}
function filterEscape(event: KeyboardEvent) {
  if (event.defaultPrevented) return;
  // Handle within the shadow dialog before the native body's Escape veto.
  event.preventDefault();
  event.stopPropagation();
  if (event.isComposing || event.keyCode === 229 || writing.value.composing)
    return;
  filtersOpen.value = false;
}
async function applyFilter() {
  const choice = pendingFilter.value;
  if (!choice) return;
  filtersOpen.value = false;
  await props.workspace.openThread(choice.url);
  await nextTick();
  returnFilterFocus();
}
watch(
  () => boardContext.value?.url,
  () => {
    filtersOpen.value = false;
  },
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
const draftList = computed(() => props.workspace.drafts.value.result);
const pendingList = computed(() =>
  state.value.loading
    ? describeDestination(state.value.destination)?.kind
    : undefined,
);
const failedList = computed(() =>
  state.value.failure
    ? describeDestination(state.value.destination)?.kind
    : undefined,
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
    : [],
);
const observedDirectory = ref<DeepReadonly<Directory> | null>(null);
const writingCategory = computed(
  () =>
    boardCategory(
      observedDirectory.value,
      writing.value.context?.action === "private-message"
        ? null
        : writing.value.context?.board.id,
    ).role,
);
let directoryAccount: string | null = null;
watch(
  [() => state.value.result, () => props.workspace.accountObservation.value],
  ([result, observation]) => {
    const resultAccount = result
      ? result.account.kind === "member"
        ? `member:${result.account.id}`
        : result.account.kind
      : null;
    const account = observation ?? resultAccount;
    if (directoryAccount !== account) {
      observedDirectory.value = null;
      directoryAccount = account;
    }
    // A failed read may retain public content with its old account metadata.
    // Only matching evidence can populate the navigation catalogue again.
    if (result?.kind === "directory" && resultAccount === account)
      observedDirectory.value = result.directory;
  },
  { immediate: true },
);
function categoryFor(id: string | null | undefined) {
  return boardCategory(observedDirectory.value, id);
}
const listCategory = computed(() => categoryFor(boardContext.value?.id));
const readerCategory = computed(() =>
  categoryFor(
    reading.value?.thread.parent
      ? boardIdFrom(reading.value.thread.parent.url)
      : null,
  ),
);
const navigationGroups = computed(
  () =>
    observedDirectory.value?.groups.map((group) => ({
      ...group,
      key: sourceGroupKey(observedDirectory.value!, group),
    })) ?? [],
);
const collapsedGroups = ref(new Set<string>());
function toggleGroup(key: string) {
  const change = () => {
    const next = new Set(collapsedGroups.value);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    collapsedGroups.value = next;
  };
  if (!props.workspace.writing.deferViewChange(change)) change();
}
const knownBoardIds = computed(
  () =>
    new Set(
      navigationGroups.value.flatMap((group) =>
        group.boards.map((board) => board.id),
      ),
    ),
);
const boardFilter = ref("");
const boardFilterInput = ref<HTMLInputElement | null>(null);
const filteredBoardGroups = computed(() => {
  if (state.value.result?.kind !== "directory") return [];
  const directory = state.value.result.directory;
  const query = boardFilter.value.trim().toLocaleLowerCase();
  return directory.groups
    .map((group) => ({
      ...group,
      key: sourceGroupKey(directory, group),
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
const currentBoardId = computed(() =>
  pickerBoard.value ? boardIdFrom(pickerBoard.value.url) : null,
);
const contextBoardChoices = computed(() => {
  const choices = new Map<string, { id: string; label: string; url: string }>();
  if (
    pickerBoard.value &&
    currentBoardId.value &&
    !knownBoardIds.value.has(currentBoardId.value)
  )
    choices.set(pickerBoard.value.url, {
      ...pickerBoard.value,
      id: currentBoardId.value,
    });
  const cataloguedURLs = new Set(
    navigationGroups.value.flatMap((group) =>
      group.boards.map((board) => board.url),
    ),
  );
  for (const board of boardContext.value?.boards ?? [])
    if (!choices.has(board.url) && !cataloguedURLs.has(board.url))
      choices.set(board.url, board);
  return [...choices.values()];
});
function currentCollapsedGroup(group: (typeof navigationGroups.value)[number]) {
  return (
    collapsedGroups.value.has(group.key) &&
    group.boards.some((board) => board.id === currentBoardId.value)
  );
}
function chooseNoticeCategory(event: Event) {
  const target = event.target;
  if (target instanceof HTMLSelectElement && target.value)
    void props.workspace.loadNotices(target.value);
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
function rememberBrowsingReader() {
  if (!threadsDocked.value && conversationVisible.value)
    browsingReaderPosition = capturePositions().filter(({ pane }) =>
      pane.classList.contains("reading-pane"),
    );
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
  // Capture before a board request adds transient loading chrome. Waiting for
  // the result watcher would remember its displaced line as the user's place.
  if (["board", "directory"].includes(route.kind)) rememberBrowsingReader();
  void props.workspace.openThread(
    link.href,
    link.closest("[data-favorite-id]")?.getAttribute("data-favorite-id") ??
      link.closest("[data-notice-id]")?.getAttribute("data-notice-id") ??
      link.closest("[data-thread-id]")?.getAttribute("data-thread-id") ??
      link.closest("[data-peer-id]")?.getAttribute("data-peer-id") ??
      null,
  );
}
let refreshTimer: ReturnType<typeof setInterval> | undefined;
function tickThreadRefresh() {
  const root = workspaceHost().shadowRoot;
  const available =
    !document.hidden &&
    ![
      ...(root?.querySelectorAll('[role="dialog"], [role="alertdialog"]') ??
        []),
    ].some((dialog) => dialog.getClientRects().length > 0);
  const visible =
    available &&
    !!root?.querySelector(".reading-pane")?.getClientRects().length;
  props.workspace.threadHistory.tick(visible);
  props.workspace.boardChecks.tick(
    available &&
      !!root
        ?.querySelector(".results-pane[data-scroll-pane=results]")
        ?.getClientRects().length,
  );
  props.workspace.privateHistory.tick(visible);
}
onMounted(() => {
  refreshTimer = setInterval(tickThreadRefresh, 1000);
  document.addEventListener("visibilitychange", tickThreadRefresh);
});
onUnmounted(() => {
  clearInterval(refreshTimer);
  document.removeEventListener("visibilitychange", tickThreadRefresh);
});
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
const readerHeading = ref<HTMLElement | null>(null);
const compactTitle = ref(false);
const keepBreadcrumb = ref(false);
function retainBreadcrumb() {
  if (!compactTitle.value || keepBreadcrumb.value) return;
  const positions = capturePositions();
  keepBreadcrumb.value = true;
  void nextTick().then(() => restorePositions(positions, true));
}
function focusedBreadcrumb(heading: HTMLElement) {
  return !!heading
    .querySelector(".reader-breadcrumb")
    ?.contains((heading.getRootNode() as ShadowRoot).activeElement);
}
const titleSpace = ref(0);
function restoreReadingHeading(restoredScroll: number | undefined) {
  const heading = readerHeading.value;

  if (heading && restoredScroll !== undefined) {
    const compact = compactTitle.value
      ? restoredScroll >= 8
      : restoredScroll > 32;
    if (compact !== compactTitle.value) {
      const before = heading.getBoundingClientRect().height;
      keepBreadcrumb.value =
        compact && (keepBreadcrumb.value || focusedBreadcrumb(heading));
      heading.dataset.keepBreadcrumb = String(keepBreadcrumb.value);
      heading.dataset.compact = String(compact);
      titleSpace.value = compact
        ? Math.max(0, before - heading.getBoundingClientRect().height)
        : 0;
      compactTitle.value = compact;
      const spacer = workspaceHost().shadowRoot?.querySelector<HTMLElement>(
        ".thread-heading-spacer",
      );
      if (spacer) spacer.style.height = `${titleSpace.value}px`;
    }
  }
}

const readingPage = ref<{
  page: string;
  url: string;
  terminal: boolean;
} | null>(null);
let pagePositionFrame: number | null = null;
function scheduleReadingPage() {
  if (pagePositionFrame !== null) return;
  pagePositionFrame = requestAnimationFrame(() => {
    pagePositionFrame = null;
    const pane =
      workspaceHost().shadowRoot?.querySelector<HTMLElement>(".reading-pane");
    if (!pane?.getClientRects().length || !reading.value) return;
    const bounds = pane.getBoundingClientRect();
    const outer = pane.closest(".conversation-region")!.getBoundingClientRect();
    const top = Math.max(bounds.top, outer.top, 0);
    const bottom = Math.min(bounds.bottom, outer.bottom, window.innerHeight);
    const post = [...pane.querySelectorAll<HTMLElement>("article[id]")].find(
      (node) => {
        const rect = node.getBoundingClientRect();
        return rect.bottom > top + 1 && rect.top < bottom - 1;
      },
    );
    const url =
      post &&
      props.workspace.threadHistory.sourceFor(post.id.replace(/^pid/, ""));
    if (!url) return;
    const page = new URL(url).searchParams.get("page") ?? "1";
    readingPage.value = {
      page,
      url,
      terminal:
        history.value.later.status === "end" &&
        (reverseReading.value
          ? Math.abs(pane.scrollTop - latestReadingScroll(pane)) <= 1
          : pane.scrollTop >= latestReadingScroll(pane) - 1),
    };
  });
}
watch(
  () => [
    reading.value?.thread.posts,
    conversationVisible.value,
    history.value.later.status,
  ],
  scheduleReadingPage,
  { flush: "post" },
);
let titlePosition: {
  pane: HTMLElement;
  anchor: HTMLElement | null;
  scroll: number;
  endDistance: number;
} | null = null;
function readingScroll(event: Event) {
  scheduleReadingPage();
  const pane = event.currentTarget;
  if (pane instanceof HTMLElement) {
    if (
      titlePosition &&
      (titlePosition.pane !== pane || titlePosition.scroll !== pane.scrollTop)
    )
      titlePosition = null;
    const compact = compactTitle.value
      ? pane.scrollTop >= 8
      : pane.scrollTop > 32;
    if (compact !== compactTitle.value && readerHeading.value) {
      const before = readerHeading.value.getBoundingClientRect().height;
      const scroll = pane.scrollTop;
      titlePosition = compact
        ? {
            pane,
            scroll,
            anchor:
              [...pane.querySelectorAll<HTMLElement>("article[id]")].find(
                (post) =>
                  post.getBoundingClientRect().bottom >
                  pane.getBoundingClientRect().top,
              ) ?? null,
            endDistance: latestReadingScroll(pane) - scroll,
          }
        : null;
      // Qualify only the original user scroll against its original edges.
      // Reflow events must neither swallow that intent nor create a new load.
      approachHistory(event, {
        top: pane.scrollTop,
        bottom: pane.scrollHeight - pane.clientHeight - pane.scrollTop,
      });
      const heading = readerHeading.value;
      // Measure the target title once, then update heading and compensation in
      // the same Vue render. A deferred scrollTop write could overwrite a newer
      // user scroll or history restoration while those two renders settle.
      const retain =
        compact && (keepBreadcrumb.value || focusedBreadcrumb(heading));
      heading.dataset.keepBreadcrumb = String(retain);
      heading.dataset.compact = String(compact);
      const after = heading.getBoundingClientRect().height;
      heading.dataset.compact = String(compactTitle.value);
      heading.dataset.keepBreadcrumb = String(keepBreadcrumb.value);
      keepBreadcrumb.value = retain;
      pane.scrollTop = scroll;
      titleSpace.value = compact ? Math.max(0, before - after) : 0;
      compactTitle.value = compact;
      // The title and its spacer settle after the scroll event. Capture the
      // now-visible character, rather than a pre-compaction line, for resize.
      void nextTick().then(() => {
        viewportPositions = viewportPositions.filter(
          (position) => position.pane !== pane,
        );
        rememberPositions();
      });
      return;
    }
  }
  approachHistory(event);
}
watch(
  () => reading.value?.thread.id,
  () => {
    compactTitle.value = false;
    keepBreadcrumb.value = false;
    readingPage.value = null;
    titleSpace.value = 0;
    titlePosition = null;
  },
);
watch(
  () => reading.value?.thread.posts,
  () => {
    titlePosition = null;
  },
);
function approachHistory(
  event: Event,
  edges?: { top: number; bottom: number },
) {
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
    if (pane.classList.contains("private-reading-pane")) {
      if (
        pane.scrollTop <= 160 &&
        privateHistory.value.result?.conversation.earlier
      )
        void props.workspace.privateHistory.load("earlier", true);
      else if (
        pane.scrollHeight - pane.clientHeight - pane.scrollTop <= 160 &&
        privateHistory.value.result?.conversation.later
      )
        void props.workspace.privateHistory.load("later", true);
      return;
    }
    if (
      (edges?.top ?? pane.scrollTop) <= 160 &&
      history.value[reverseReading.value ? "later" : "earlier"].status ===
        "unloaded"
    )
      void props.workspace.threadHistory.load(
        reverseReading.value ? "later" : "earlier",
        true,
      );
    else if (
      (edges?.bottom ??
        pane.scrollHeight - pane.clientHeight - pane.scrollTop) <= 160 &&
      history.value[reverseReading.value ? "earlier" : "later"].status ===
        "unloaded"
    )
      void props.workspace.threadHistory.load(
        reverseReading.value ? "earlier" : "later",
        true,
      );
  });
}
onUnmounted(() => {
  if (pagePositionFrame !== null) cancelAnimationFrame(pagePositionFrame);
  if (historyFrame !== null) cancelAnimationFrame(historyFrame);
  if (restorationFrame !== null) cancelAnimationFrame(restorationFrame);
});
let stopReadingImageRestore: (() => void) | undefined;
function latestReadingScroll(reader: HTMLElement) {
  if (
    reverseReading.value &&
    !reader.classList.contains("private-reading-pane")
  ) {
    const boundary = reader.querySelector<HTMLElement>(".newest-check");
    const post = reader.querySelector<HTMLElement>(
      `#pid${newestReplyId.value}`,
    );
    const anchor = boundary ?? post;
    return anchor
      ? Math.max(
          0,
          reader.scrollTop +
            anchor.getBoundingClientRect().top -
            reader.getBoundingClientRect().top,
        )
      : 0;
  }
  const end = reader.scrollHeight - reader.clientHeight;
  const last = reader.querySelector<HTMLElement>("article:last-of-type");
  const content = last?.querySelector<HTMLElement>(".post-content");
  if (!content || !last?.querySelector(".post-actions")) return end;
  // Public reply/quote controls follow the content. Follow the content endpoint
  // while leaving those controls available through ordinary further scrolling.
  return Math.max(
    0,
    Math.min(
      end,
      Math.ceil(
        reader.scrollTop +
          content.getBoundingClientRect().bottom -
          reader.getBoundingClientRect().bottom,
      ),
    ),
  );
}
function followPendingReadingImages(
  container: HTMLElement,
  target: HTMLElement,
  savedOffset: (() => number) | null,
  { followEnd = false, clamped = false } = {},
) {
  const pending = new Set(
    [...container.querySelectorAll<HTMLImageElement>("img")].filter(
      (image) =>
        !image.complete &&
        (followEnd ||
          clamped ||
          !!(
            target.compareDocumentPosition(image) &
            Node.DOCUMENT_POSITION_PRECEDING
          )),
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
    if (followEnd) container.scrollTop = latestReadingScroll(container);
    else if (savedOffset !== null) {
      const offset = savedOffset();
      container.scrollTop += target.getBoundingClientRect().top - offset;
    } else target.scrollIntoView({ block: "start" });
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
      ["thread", "private-conversation"].includes(
        state.value.result?.kind ?? "",
      ) ||
        describeDestination(state.value.destination)?.kind ===
          "private-conversation"
        ? '[data-scroll-pane="reading"]'
        : "#thread-list-pane",
    );
  // Live history can reflow post metadata when the reader width changes. Keep
  // its actual visible character alongside the existing persisted post anchor.
  // Exact identity checks make changed/missing content use the established fallback.
  const readingCharacters = new WeakMap<
    ViewPosition,
    {
      thread: string;
      post: string;
      node: number;
      text: string;
      character: number;
      top: number;
      paneTop: number;
      width: number;
    }
  >();
  const textNodes = (post: Element) => {
    const walker = document.createTreeWalker(post, NodeFilter.SHOW_TEXT);
    const nodes: Node[] = [];
    let node: Node | null;
    while ((node = walker.nextNode())) nodes.push(node);
    return nodes;
  };
  const loadingRebasedPositions = new WeakSet<ViewPosition>();
  const browsingPositions = new WeakMap<
    ViewPosition,
    {
      navigation: number | undefined;
      row?: { id: string; offset: number; width: number };
    }
  >();
  let rebasedLoadingReader = false;
  const capturePane = (container: HTMLElement | null | undefined) => {
    const reader = root.shadowRoot?.querySelector<HTMLElement>(".reading-pane");
    const blocks =
      container?.querySelectorAll<HTMLElement>(
        "article[id], [data-thread-id], [data-draft-id]",
      ) ?? [];
    const retainedTitleAnchor =
      titlePosition &&
      container &&
      titlePosition.pane === container &&
      titlePosition.scroll === container.scrollTop &&
      titlePosition.anchor?.isConnected
        ? titlePosition.anchor
        : null;
    const anchor =
      retainedTitleAnchor ??
      [...blocks].find(
        (node) =>
          node.getBoundingClientRect().bottom >
          (container?.getBoundingClientRect().top ?? 0),
      );
    const position = {
      anchor: anchor?.id ?? null,
      offset: anchor?.getBoundingClientRect().top ?? 0,
      scrollTop: container?.scrollTop ?? root.scrollTop,
      readingScrollTop:
        root.shadowRoot?.querySelector<HTMLElement>(".reading-pane")
          ?.scrollTop ?? 0,
      ...(reader
        ? {
            readingPaneTop: reader.getBoundingClientRect().top,
            readingRegionScrollTop:
              reader.closest(".conversation-region")?.scrollTop ?? 0,
          }
        : {}),
      resultsScrollTop:
        root.shadowRoot?.querySelector<HTMLElement>(
          ".results-pane, .messages-pane",
        )?.scrollTop ?? 0,
      ...(container?.classList.contains("board-thread-list")
        ? { resultsPaneTop: container.getBoundingClientRect().top }
        : {}),
    };
    if (container === reader && reader && reading.value) {
      const range = visibleReadingRange(reader);
      const post = range?.startContainer.parentElement?.closest("article[id]");
      if (range && post && range.startContainer.textContent)
        readingCharacters.set(position, {
          thread: reading.value.thread.id,
          post: post.id,
          node: textNodes(post).indexOf(range.startContainer),
          text: range.startContainer.textContent,
          character: range.startOffset,
          top: range.getBoundingClientRect().top,
          paneTop: reader.getBoundingClientRect().top,
          width: reader.getBoundingClientRect().width,
        });
    }
    if (state.value.loading && rebasedLoadingReader)
      loadingRebasedPositions.add(position);
    else if (!state.value.loading) rebasedLoadingReader = false;
    return position;
  };
  const navigationPane = () =>
    root.shadowRoot?.querySelector<HTMLElement>(".navigation-body");
  const resultsPane = () =>
    root.shadowRoot?.querySelector<HTMLElement>(
      ".results-pane, .messages-pane",
    );
  const restoreReadingViewport = (
    position: ViewPosition | null,
    exactHistory = false,
  ) => {
    // A cached/reloaded reader is restored before its first scroll event. Settle
    // its title now so the viewport calculation sees the final heading height,
    // rather than rebasing for an expanded title that immediately compacts.
    restoreReadingHeading(position?.readingScrollTop);
    // History can settle before the queued browser resize event. Update the
    // existing viewport owner before the old host height clamps outer scrolling.
    if (
      window.innerWidth !== viewportWidth ||
      window.innerHeight !== viewportHeight
    )
      resize();
    const reader = root.shadowRoot?.querySelector<HTMLElement>(".reading-pane");
    const region = reader?.closest<HTMLElement>(".conversation-region");
    if (!reader || !region || !position) return 0;
    if (position.readingRegionScrollTop !== undefined)
      region.scrollTop = position.readingRegionScrollTop;
    if (position.readingPaneTop === undefined) return 0;
    const bounds = region.getBoundingClientRect();
    const visibleTop = Math.max(0, bounds.top);
    const visibleBottom = Math.min(window.innerHeight, bounds.bottom);
    const visibleHeight = Math.min(
      reader.clientHeight,
      Number.parseFloat(getComputedStyle(reader).minHeight) ||
        reader.clientHeight,
      Math.max(0, visibleBottom - visibleTop),
    );
    const targetTop = Math.min(
      position.readingPaneTop,
      Math.max(visibleTop, visibleBottom - visibleHeight),
    );
    region.scrollTop += reader.getBoundingClientRect().top - targetTop;
    // Only reverse a loading-row displacement that actually rebased text.
    // Weak membership stays local to this live view and adds no recovery fields.
    if (
      !reader.classList.contains("private-reading-pane") &&
      loadingRebasedPositions.has(position)
    )
      return reader.getBoundingClientRect().top - position.readingPaneTop;
    if (state.value.loading) rebasedLoadingReader = false;
    if (!reader.classList.contains("private-reading-pane") && position.anchor) {
      const anchor = root.shadowRoot?.getElementById(position.anchor);
      if (anchor && reader.contains(anchor)) {
        const delta = position.offset - anchor.getBoundingClientRect().top;
        const current = reader.getBoundingClientRect();
        const clippedTop = Math.max(visibleTop, current.top);
        const clippedBottom = Math.min(visibleBottom, current.bottom);
        const previousTop = Math.max(0, position.readingPaneTop);
        const character = readingCharacters.get(position);
        if (
          character &&
          character.thread === reading.value?.thread.id &&
          character.width !== current.width
        ) {
          const post = root.shadowRoot?.getElementById(character.post);
          const node =
            post && reader.contains(post)
              ? textNodes(post)[character.node]
              : undefined;
          if (
            node?.textContent === character.text &&
            character.character < character.text.length
          ) {
            const range = document.createRange();
            range.setStart(node, character.character);
            range.setEnd(node, character.character + 1);
            const textRect = range.getBoundingClientRect();
            if (textRect.width > 0 && textRect.height > 0) {
              const fits =
                character.top >= clippedTop &&
                character.top + textRect.height <= clippedBottom;
              const target = fits
                ? character.top
                : Math.max(
                    clippedTop,
                    Math.min(
                      clippedBottom - textRect.height,
                      clippedTop + character.top - character.paneTop,
                    ),
                  );
              return (
                target -
                position.offset -
                (textRect.top - anchor.getBoundingClientRect().top)
              );
            }
          }
        }
        if (exactHistory) {
          const bounds = anchor.getBoundingClientRect();
          if (
            bounds.bottom + delta > clippedTop &&
            position.offset < clippedBottom
          )
            return 0;
        }
        const content = reader.querySelectorAll(".post-content");
        let first: DOMRect | undefined;
        for (const block of content) {
          const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
          let text: Node | null;
          while (!first && (text = walker.nextNode())) {
            if (!text.textContent?.trim()) continue;
            const range = document.createRange();
            range.selectNodeContents(text);
            first = [...range.getClientRects()].find(
              (rect) =>
                rect.width > 0 &&
                rect.height > 0 &&
                rect.bottom + delta > previousTop + 1,
            );
          }
          if (first) break;
        }
        // Keep a valid screen anchor when changed chrome still leaves its
        // previously visible text intact. Rebase only when that line is clipped.
        if (
          first &&
          Math.max(previousTop, first.top + delta) >= clippedTop - 1 &&
          first.bottom + delta <= clippedBottom + 1
        )
          return 0;
      }
    }
    // An old screen position can fall outside a resized viewport. Rebase the
    // retained line there, and also protect it from unabsorbed heading growth.
    const shift =
      targetTop -
      position.readingPaneTop +
      Math.max(0, reader.getBoundingClientRect().top - targetTop);
    if (
      state.value.loading &&
      !reader.classList.contains("private-reading-pane")
    )
      rebasedLoadingReader = shift !== 0;
    return shift;
  };
  props.workspace.setViewAdapter({
    dismissForHistory() {
      destinationsOpen.value = false;
      if (!drawer.value) return;
      rememberPaneScroll();
      drawer.value = null;
      appearanceAnchors = [];
    },
    nearLatest() {
      const reader =
        root.shadowRoot?.querySelector<HTMLElement>(".reading-pane");
      if (!reader) return false;
      const distance =
        titlePosition?.pane === reader &&
        titlePosition.scroll === reader.scrollTop
          ? titlePosition.endDistance
          : latestReadingScroll(reader) - reader.scrollTop;
      return (
        (reverseReading.value &&
        !reader.classList.contains("private-reading-pane")
          ? Math.abs(distance)
          : distance) <= 64
      );
    },
    followLatest() {
      suppressAutomaticHistory();
      const reader =
        root.shadowRoot?.querySelector<HTMLElement>(".reading-pane");
      stopReadingImageRestore?.();
      if (reader) {
        restoreReadingViewport(capturePane(reader));
        readingRestoreRevision++;
        reader.scrollTop = latestReadingScroll(reader);
        const last = reader.querySelector<HTMLElement>("article:last-of-type");
        if (last)
          followPendingReadingImages(reader, last, null, { followEnd: true });
      }
    },
    capture: () => {
      const position = capturePane(pane());
      const navigation = navigationPane();
      const results = resultsPane();
      const top = results?.getBoundingClientRect().top ?? 0;
      const row =
        results?.classList.contains("board-thread-list") &&
        results.getClientRects().length
          ? [...results.querySelectorAll<HTMLElement>("[data-thread-id]")].find(
              (item) => item.getBoundingClientRect().bottom > top + 1,
            )
          : null;
      browsingPositions.set(position, {
        navigation: navigation?.getClientRects().length
          ? navigation.scrollTop
          : navigation
            ? paneScroll.get(navigation)
            : undefined,
        ...(row
          ? {
              row: {
                id: row.id,
                offset: row.getBoundingClientRect().top - top,
                width: results!.clientWidth,
              },
            }
          : {}),
      });
      return position;
    },
    captureReading: () => {
      const position = capturePane(
        root.shadowRoot?.querySelector<HTMLElement>(".reading-pane"),
      );
      // At the top a check exposes its status. Preserve zero instead of
      // anchoring the first post below a changing status row; history loads
      // still retain their post anchor when prepending earlier content.
      if (history.value.checking) {
        if (position.scrollTop === 0) position.anchor = null;
        else {
          // A pinned opener's trailing box may still intersect the viewport
          // while the reader is actually on a later post. Anchor that text's
          // post before new replies can be inserted between the two.
          const character = readingCharacters.get(position);
          const post =
            character && root.shadowRoot?.getElementById(character.post);
          if (post) {
            position.anchor = post.id;
            position.offset = post.getBoundingClientRect().top;
          }
        }
      }
      return position;
    },
    restoreReading(position, exactHistory) {
      suppressAutomaticHistory();
      stopReadingImageRestore?.();
      const container =
        root.shadowRoot?.querySelector<HTMLElement>(".reading-pane");
      if (!container) return;
      const offset =
        position.offset + restoreReadingViewport(position, exactHistory);
      readingRestoreRevision++;
      container.scrollTop = position.scrollTop;
      const node = position.anchor
        ? root.shadowRoot?.getElementById(position.anchor)
        : null;
      if (node && container.contains(node)) {
        const desired =
          container.scrollTop + node.getBoundingClientRect().top - offset;
        container.scrollTop = desired;
        const clamped = desired > container.scrollTop + 1;
        followPendingReadingImages(
          container,
          node,
          clamped
            ? () =>
                position.offset + restoreReadingViewport(position, exactHistory)
            : () => offset,
          { clamped },
        );
      }
    },
    focusReadingPost(postId, preservePosition) {
      const post = root.shadowRoot?.getElementById(`pid${postId}`);
      const reader = post?.closest<HTMLElement>(".reading-pane");
      if (!post || !reader) return;
      if (!preservePosition) {
        suppressAutomaticHistory();
        stopReadingImageRestore?.();
        restoreReadingViewport(capturePane(reader));
        readingRestoreRevision++;
        post.scrollIntoView({ block: "start" });
      }
      if (!writing.value.visible && !writing.value.composing)
        post.focus({ preventScroll: true });
      if (!preservePosition) followPendingReadingImages(reader, post, null);
    },
    restore(position, target, selection) {
      suppressAutomaticHistory();
      stopReadingImageRestore?.();

      const viewportShift = restoreReadingViewport(position);
      readingRestoreRevision++;
      const container = pane();
      if (container) container.scrollTop = position?.scrollTop ?? 0;
      const reader =
        root.shadowRoot?.querySelector<HTMLElement>(".reading-pane");
      const results = resultsPane();
      const browsing = position && browsingPositions.get(position);
      const navigation = navigationPane();
      if (navigation && browsing?.navigation !== undefined) {
        paneScroll.set(navigation, browsing.navigation);
        if (navigation.getClientRects().length)
          navigation.scrollTop = browsing.navigation;
      }
      if (reader && position?.readingScrollTop !== undefined)
        reader.scrollTop = position.readingScrollTop;
      if (results && position?.resultsScrollTop !== undefined)
        results.scrollTop = position.resultsScrollTop;
      const requested = target
        ? root.shadowRoot?.getElementById(
            `${state.value.privateReading ? "pmlist_" : "pid"}${target}`,
          )
        : null;
      const saved = position?.anchor
        ? root.shadowRoot?.getElementById(position.anchor)
        : null;
      const node = saved && container?.contains(saved) ? saved : null;
      let clamped = false;
      if (container && node && position) {
        const desired =
          container.scrollTop +
          node.getBoundingClientRect().top -
          (position.offset +
            (container === reader
              ? viewportShift
              : position.resultsPaneTop !== undefined
                ? container.getBoundingClientRect().top -
                  position.resultsPaneTop
                : 0));
        container.scrollTop = desired;
        clamped = desired > container.scrollTop + 1;
      }
      if (requested && !node && (!position || position.readingScrollTop === 0))
        requested.scrollIntoView({ block: "start" });
      const row = browsing?.row
        ? root.shadowRoot?.getElementById(browsing.row.id)
        : null;
      if (
        results &&
        row &&
        browsing?.row &&
        results.clientWidth !== browsing.row.width &&
        results.contains(row)
      )
        results.scrollTop +=
          row.getBoundingClientRect().top -
          results.getBoundingClientRect().top -
          browsing.row.offset;
      if (
        (!position || position.resultsScrollTop === 0) &&
        !state.value.loading &&
        state.value.result?.kind === "search" &&
        state.value.result.search.results
      )
        container
          ?.querySelector<HTMLElement>(".search-results h2")
          ?.scrollIntoView({ block: "start" });
      const selected = selection
        ? (root.shadowRoot
            ?.getElementById(`draft-${selection}`)
            ?.querySelector<HTMLElement>("button") ??
          root.shadowRoot?.getElementById(`favorite-${selection}`) ??
          root.shadowRoot?.getElementById(`notice-${selection}`) ??
          root.shadowRoot
            ?.getElementById(`peer-${selection}`)
            ?.querySelector<HTMLElement>("a[aria-current]") ??
          root.shadowRoot
            ?.getElementById(`row-${selection}`)
            ?.querySelector<HTMLElement>(".subject"))
        : null;
      const focusTarget = container?.classList.contains("board-thread-list")
        ? (selected ?? node?.querySelector<HTMLElement>(".subject"))
        : personalCanvas.value && container !== reader
          ? (selected ?? node)
          : (requested ?? node ?? selected);
      if (!writing.value.visible && !writing.value.composing)
        focusTarget?.focus({ preventScroll: true });
      if (container && (node || requested))
        followPendingReadingImages(
          container,
          (node ?? requested)!,
          node && position
            ? () => position.offset + (container === reader ? viewportShift : 0)
            : null,
          { clamped },
        );
    },
  });
});
const accountPresentation = computed(() => {
  const retained =
    state.value.section === "drafts"
      ? props.workspace.drafts.value.result?.account
      : state.value.result?.account;
  const observation = props.workspace.accountObservation.value;
  // Public content can outlive its account evidence. Use only metadata matching
  // the latest accepted observation; null alone still denotes a passive snapshot.
  const account =
    observation === null
      ? retained
      : [writing.value.accountObservation, retained].find(
          (value) =>
            value &&
            (value.kind === "member" ? `member:${value.id}` : value.kind) ===
              observation,
        );
  if (account?.kind === "member") {
    const snapshot = observation === null && state.value.restored;
    return {
      label: insert(
        snapshot ? text.value.snapshotMember : text.value.signedIn,
        account.name,
      ),
      name: account.name,
      status: snapshot
        ? text.value.snapshotMemberStatus
        : text.value.signedInStatus,
    };
  }
  return {
    label:
      account?.kind === "guest"
        ? observation === null && state.value.restored
          ? text.value.snapshotGuest
          : text.value.guest
        : text.value.accountUnknown,
    name: null,
    status: "",
  };
});
const accountLabel = computed(() => accountPresentation.value.label);

function boardIdFrom(url: string) {
  return new URL(url).searchParams.get("fid") ?? "";
}
</script>
<template>
  <div
    class="workspace"
    :data-destination-bar="!boardsDocked"
    @click="navigate"
  >
    <DialogRoot :open="filtersOpen" @update:open="filtersOpen = $event">
      <DialogPortal :to="portal">
        <DialogOverlay class="dialog-overlay" />
        <DialogContent
          class="dialog-content board-filter-dialog"
          @keydown.esc="filterEscape"
          @close-auto-focus.prevent="returnFilterFocus"
        >
          <DialogTitle>{{ text.boardFilters }}</DialogTitle>
          <DialogDescription>{{ text.filterHelp }}</DialogDescription>
          <nav class="board-filters" :aria-label="text.boardFilters">
            <div
              v-for="(group, index) in boardFilterGroups"
              :key="`${group.sourceId}:${index}`"
              role="group"
              :aria-label="group.label"
              class="board-filter-group"
            >
              <h2>{{ group.label }}</h2>
              <div class="board-filter-links">
                <button
                  v-for="filter in group.links"
                  :key="filter.url"
                  :aria-pressed="pendingFilterURL === filter.url"
                  :disabled="
                    !boardContext?.filterChoices?.some(
                      (choice) => choice.url === filter.url,
                    )
                  "
                  :data-category="
                    group.kind === 'category' ? listCategory.role : undefined
                  "
                  @click="
                    chooseFilter(filter.url, `${group.label} · ${filter.label}`)
                  "
                >
                  {{ filter.label }}
                </button>
              </div>
            </div>
          </nav>

          <p v-if="!boardContext?.filterChoices" role="status">
            {{ text.filterUnavailable }}
          </p>
          <div v-if="pendingFilter" aria-live="polite" class="filter-preview">
            <p>
              <strong>{{ pendingFilterName }}</strong>
            </p>
            <p>{{ text.filterNext }}</p>
            <ul class="filter-proposed">
              <li
                v-for="criterion in pendingFilter.criteria"
                :key="criterion.label"
              >
                {{ criterion.label }}
              </li>
              <li v-if="!pendingFilter.criteria.length">
                {{ text.filterAll }}
              </li>
            </ul>
            <template v-if="pendingFilter.removed.length"
              ><p>{{ text.filterReplaces }}</p>
              <ul class="filter-removed">
                <li
                  v-for="criterion in pendingFilter.removed"
                  :key="criterion.label"
                >
                  {{ criterion.label }}
                </li>
              </ul></template
            >
          </div>
          <div class="filter-dialog-actions">
            <button
              :disabled="!boardContext?.clearFilter"
              @click="
                boardContext?.clearFilter &&
                chooseFilter(boardContext.clearFilter.url, text.filterClear)
              "
            >
              {{ text.filterClear }}
            </button>
            <button @click="filtersOpen = false">
              {{ text.filterCancel }}
            </button>
            <button :disabled="!pendingFilter" @click="applyFilter">
              {{ text.filterApply }}
            </button>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>

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
              narrowBrowsing = false;
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
    <DialogRoot :open="destinationsOpen" @update:open="changeDestinations">
      <DialogPortal :to="portal">
        <DialogOverlay class="dialog-overlay" />
        <DialogContent
          class="dialog-content destination-dialog"
          :aria-describedby="undefined"
          @escape-key-down="guardEscape"
          @close-auto-focus.prevent
        >
          <div class="destination-dialog-heading">
            <DialogTitle as-child>
              <h2
                ref="accountHeading"
                :tabindex="showingAccount ? -1 : undefined"
              >
                {{
                  showingAccount
                    ? text.destinationAccount
                    : boardsDocked
                      ? text.mainDestinations
                      : text.moreDestinations
                }}
              </h2>
            </DialogTitle>
            <button @click="changeDestinations(false)">{{ text.close }}</button>
          </div>
          <p v-if="showingAccount">{{ accountLabel }}</p>
          <div v-else class="destination-entries">
            <button
              v-for="section in boardsDocked ? sections : secondarySections"
              :key="section"
              :aria-current="
                state.section === section &&
                (section !== 'boards' || directorySelected)
                  ? 'page'
                  : undefined
              "
              @click="selectSection(section)"
            >
              <WorkspaceIcon :name="section" />
              {{ section === "boards" ? text.allBoards : text[section] }}
            </button>
            <button @click="showAccount">
              <WorkspaceIcon name="about" />{{ text.destinationAccount }}
            </button>
            <button @click="openDestinationSettings">
              <WorkspaceIcon name="settings" />{{ text.settings }}
            </button>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
    <header>
      <a class="brand" href="https://www.tsdm39.com/" aria-label="TSDM"
        ><WorkspaceBrand />TSDM</a
      >
      <div class="header-navigation">
        <button
          v-if="personalCanvas && state.canBack"
          class="header-action"
          @click="workspace.back()"
        >
          {{ text.back }}
        </button>
        <button
          v-if="boardsDocked"
          ref="mainDestinationsTrigger"
          class="header-action main-destinations-trigger"
          aria-haspopup="dialog"
          :aria-expanded="destinationsOpen"
          @click="changeDestinations(true)"
        >
          <WorkspaceIcon name="more" />{{ text.mainDestinations }}
        </button>
        <button
          ref="boardsTrigger"
          class="header-action"
          :title="text.boardsPane"
          :aria-label="text.boardsPane"
          :aria-expanded="boardsDocked ? !boardsCollapsed : drawer === 'boards'"
          aria-controls="boards-pane"
          @click="togglePane('boards')"
        >
          <WorkspaceIcon name="boards" /><span class="header-action-label">{{
            text.boards
          }}</span>
        </button>
        <button
          v-if="!standaloneTaskReader"
          ref="threadsTrigger"
          class="header-action"
          :title="text.threadsPane"
          :aria-label="text.threadsPane"
          :aria-expanded="resultsVisible"
          aria-controls="thread-list-pane"
          @click="togglePane('threads')"
        >
          <WorkspaceIcon name="threads" /><span class="header-action-label">{{
            text.threadsPane
          }}</span>
        </button>
        <ReplyRecoveryDialog :workspace="workspace" :portal="portal" />
        <a
          class="header-action"
          :aria-label="text.native"
          :title="text.native"
          :href="nativeDestination(sectionInfo?.nativeURL ?? state.destination)"
          ><WorkspaceIcon name="native" /><span class="header-action-label">{{
            text.native
          }}</span></a
        >
      </div>
    </header>
    <Teleport :to="contextTools ?? portal" :disabled="!contextTools">
      <div
        v-if="state.result?.kind !== 'thread'"
        id="navigation-tools"
        class="workspace-tools"
      >
        <nav :aria-label="text.actions">
          <a
            v-if="state.section === 'search'"
            class="narrow-overview-link search-new-link"
            href="https://www.tsdm39.com/search.php?mod=forum&adv=yes"
            >{{ text.newSearch }}</a
          >
          <button
            v-if="state.canBack && !reading && !personalCanvas"
            @click="workspace.back()"
          >
            {{ text.back }}</button
          ><button
            v-if="
              state.result?.kind === 'search' && state.result.search.effective
            "
            :aria-describedby="searchEffectsId"
            @click="workspace.submitSearch(true)"
          >
            {{ text.rerunSearch }}</button
          ><button
            v-else-if="
              state.result?.kind !== 'directory' &&
              state.result?.kind !== 'board' &&
              (state.section === 'boards' || state.section === 'search')
            "
            @click="workspace.refresh()"
          >
            {{
              state.destination.includes("mod=viewthread")
                ? text.refreshThread
                : text.refresh
            }}
          </button>
        </nav>
      </div>
    </Teleport>
    <Teleport
      v-if="state.section === 'notices' && noticeContext"
      :to="boardContextTools ?? portal"
      :disabled="!boardContextTools"
    >
      <div class="workspace-tools board-navigation-tools">
        <label class="board-picker"
          >{{ text.noticeCategories
          }}<select
            :aria-label="text.noticeCategories"
            :aria-describedby="noticeEffectsId"
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
      </div>
    </Teleport>
    <Teleport :to="boardContextTools ?? portal" :disabled="!boardContextTools">
      <BoardWritingActions
        v-if="
          !boardResultsAvailable && pickerBoard && boardIdFrom(pickerBoard.url)
        "
        :workspace="workspace"
        :portal="portal"
        :board-id="boardIdFrom(pickerBoard.url)"
      />
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
      <section
        v-if="state.replyRecovery?.problem"
        :aria-label="text.localReplyAttention"
        role="region"
      >
        <p role="alert">
          {{
            state.replyRecovery.problem.kind === "incompatible"
              ? text.localReplyIncompatible
              : text.localReplyUnsaved
          }}
        </p>
        <details v-if="state.replyRecovery.problem.raw !== null">
          <summary>{{ text.localReplyInspect }}</summary>
          <textarea
            readonly
            :aria-label="text.localReplyRaw"
            :value="state.replyRecovery.problem.raw"
            rows="8"
          />
        </details>
      </section>
      <p
        v-if="
          state.recoveryAvailable === false &&
          state.replyRecovery?.sessionAvailable !== true
        "
        class="recovery-note"
      >
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
        {{
          state.restored
            ? workspace.accountObservation.value === null
              ? text.restored
              : text.restoredContent
            : text.stale
        }}
      </p>
      <p
        v-if="
          state.loading &&
          !['favorites', 'messages', 'notices'].includes(pendingList ?? '')
        "
        role="status"
      >
        {{ text.loading }}
      </p>
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
      :class="{
        'thread-without-results': threadWithoutResults,
        'browse-only': browseOnly,
      }"
      :style="columnStyle"
      :data-column-resizing="resizingColumns || undefined"
      :data-boards-collapsed="!boardsDocked || boardsCollapsed"
      :data-threads-collapsed="
        !threadsDocked ||
        threadsCollapsed ||
        writingOnCanvas ||
        standaloneTaskReader
      "
      :data-view="state.result?.kind ?? 'unavailable'"
      :data-narrow-browsing="
        (!threadsDocked && resultsVisible) ||
        (!boardsDocked && browsingCanvas && !writingOnCanvas)
      "
    >
      <ColumnSeparator
        v-if="boardsResizable"
        :label="text.resizeBoards"
        v-bind="columnBounds.boards"
        :style="{ left: `${columnBounds.boards.value}px` }"
        @begin="beginColumnResize"
        @change="setColumnWidth('boards', $event)"
        @reset="setColumnWidth('boards', defaultWidths.boards)"
        @end="endColumnResize"
      />
      <ColumnSeparator
        v-if="threadsResizable"
        :label="text.resizeThreads"
        v-bind="columnBounds.threads"
        :style="{
          left: `${columnBounds.boards.value + columnBounds.threads.value}px`,
        }"
        @begin="beginColumnResize"
        @change="setColumnWidth('threads', $event)"
        @reset="setColumnWidth('threads', defaultWidths.threads)"
        @end="endColumnResize"
      />
      <ColumnSeparator
        v-if="writingWide && conversationVisible"
        :label="text.resizeWriting"
        v-bind="columnBounds.writing"
        :style="{ left: `${paneWidth - columnBounds.writing.value}px` }"
        reverse
        @begin="beginColumnResize"
        @change="setColumnWidth('writing', $event)"
        @reset="setColumnWidth('writing', defaultWidths.writing)"
        @end="endColumnResize"
      />
      <Teleport
        :to="drawerContent ?? portal"
        :disabled="drawer !== 'boards' || !drawerContent"
      >
        <div
          v-show="(boardsDocked && !boardsCollapsed) || drawer === 'boards'"
          id="boards-pane"
          class="boards-region pane"
        >
          <div class="navigation-body pane">
            <p class="navigation-caption">{{ text.mainDestinations }}</p>
            <nav :aria-label="text.mainDestinations" class="main-destinations">
              <button
                v-for="section in sections"
                :key="section"
                :aria-current="
                  state.section === section &&
                  (section !== 'boards' || state.result?.kind === 'directory')
                    ? 'page'
                    : undefined
                "
                @click="selectSection(section)"
              >
                <WorkspaceIcon :name="section" /><span
                  class="destination-label"
                  >{{
                    section === "boards" ? text.allBoards : text[section]
                  }}</span
                >
              </button>
            </nav>
            <nav
              v-if="
                state.section === 'boards' && state.result?.kind !== 'directory'
              "
              :aria-label="text.boardsNavigation"
              class="boards-navigation board-tree pane"
            >
              <h2>{{ text.browseBoards }}</h2>
              <section
                v-for="group in navigationGroups"
                :key="group.key"
                class="board-disclosure"
                :data-category="groupCategory(group).role"
              >
                <button
                  :aria-label="
                    currentCollapsedGroup(group)
                      ? `${group.title} · ${text.currentBoard}`
                      : group.title
                  "
                  :aria-expanded="!collapsedGroups.has(group.key)"
                  :data-current-group="
                    currentCollapsedGroup(group) || undefined
                  "
                  @click="toggleGroup(group.key)"
                >
                  <WorkspaceIcon name="disclosure" />
                  <span
                    class="category-label"
                    :data-category="groupCategory(group).role"
                    >{{ group.title }}</span
                  ><span class="group-count" aria-hidden="true">{{
                    group.boards.length
                  }}</span>
                </button>
                <div
                  v-show="!collapsedGroups.has(group.key)"
                  class="board-group-links"
                >
                  <a
                    v-for="board in group.boards"
                    :key="board.url"
                    :href="board.url"
                    :aria-current="
                      currentBoardId === board.id ? 'page' : undefined
                    "
                    ><span
                      class="category-dot"
                      :data-category="categoryFor(board.id).role"
                      aria-hidden="true"
                    />{{ board.label }}</a
                  >
                </div>
              </section>
              <a
                v-for="board in contextBoardChoices"
                :key="board.url"
                :href="board.url"
                :aria-current="currentBoardId === board.id ? 'page' : undefined"
                ><span
                  class="category-dot"
                  :data-category="categoryFor(board.id).role"
                  aria-hidden="true"
                />{{ board.label }}</a
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
                :aria-describedby="noticeEffectsId"
                :aria-current="category.current ? 'page' : undefined"
                >{{ category.label }}</a
              >
              <p v-if="!noticeContext">{{ text.noticesHeading }}</p>
            </nav>
            <div ref="boardContextTools" class="board-context-tools" />
          </div>
          <footer class="navigation-footer">
            <p class="navigation-account" :title="accountLabel">
              <template v-if="accountPresentation.name !== null">
                <small>{{ accountPresentation.status }}</small>
                <strong>{{ accountPresentation.name }}</strong>
              </template>
              <template v-else>{{ accountLabel }}</template>
            </p>
            <SettingsDialog
              ref="settings"
              :workspace="workspace"
              :portal="portal"
              @open-change="settingsOpenChanged"
              @close-auto-focus="settingsFocusReturn"
              @reset-columns="resetColumns"
            />
          </footer>
        </div>
      </Teleport>
      <section
        v-if="sectionInfo"
        v-show="sectionResultsVisible"
        id="thread-list-pane"
        class="overview pane results-pane drafts-pane"
        data-scroll-pane="results"
      >
        <h1>{{ sectionInfo.title }}</h1>
        <h2>{{ sectionInfo.heading }}</h2>
        <p>{{ sectionInfo.description }}</p>
        <template v-if="state.section === 'drafts'">
          <DestinationLoadStatus
            :loaded="draftList?.kind === 'drafts'"
            :empty="
              draftList?.kind === 'drafts' && draftList.drafts.rows.length === 0
            "
            :pending="workspace.drafts.value.loading"
            :failed="draftList !== null && draftList.kind !== 'drafts'"
            :language="workspace.preferences.state.value.language"
          />
          <button
            :disabled="workspace.drafts.value.loading"
            @click="
              workspace.loadDrafts(
                draftList?.kind === 'drafts' ? draftList.drafts.url : undefined,
              )
            "
          >
            {{
              draftList?.kind === "drafts"
                ? text.refreshDrafts
                : text.loadDrafts
            }}
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
                :id="`draft-${draft.threadId}`"
                :key="draft.threadId"
                class="thread-row"
                :data-draft-id="draft.threadId"
                :aria-current="
                  state.selection === draft.threadId ? 'true' : undefined
                "
              >
                <button
                  :aria-label="insert(text.resumeDraft, draft.title)"
                  @click="workspace.resumeDraft(draft.threadId)"
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
      <SearchView
        v-if="searchContext"
        v-show="sectionResultsVisible"
        id="thread-list-pane"
        :search="searchContext"
        :language="workspace.preferences.state.value.language"
        :warning-id="searchEffectsId"
        :secondary="state.result?.kind === 'thread'"
        :selection="state.selection ?? selectedThread"
        :loading="state.loading"
        @submit="workspace.submitSearch"
        @edit="workspace.editSearch"
      />
      <FavoritesView
        v-if="state.section === 'saved'"
        v-show="sectionResultsVisible"
        id="thread-list-pane"
        :favorites="favoriteContext"
        :selection="state.selection"
        :secondary="state.result?.kind === 'thread'"
        :board-target="state.result?.kind === 'board'"
        :loading="state.loading"
        :pending="pendingList === 'favorites'"
        :failed="failedList === 'favorites'"
        :language="workspace.preferences.state.value.language"
        @refresh="workspace.openThread($event)"
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
        v-show="sectionResultsVisible"
        id="thread-list-pane"
        :selected="state.privateReading?.conversation.peerId ?? state.selection"
        :messages="
          state.result?.kind === 'messages'
            ? state.result.messages
            : (state.privateReading || pendingPrivate) &&
                state.origin?.kind === 'messages'
              ? state.origin.messages
              : null
        "
        :loading="state.loading"
        :pending="pendingList === 'messages'"
        :failed="failedList === 'messages'"
        :language="workspace.preferences.state.value.language"
        @load="workspace.loadMessages()"
      />
      <NoticesView
        v-if="state.section === 'notices'"
        v-show="sectionResultsVisible"
        id="thread-list-pane"
        :notices="noticeContext"
        :loading="state.loading"
        :pending="pendingList === 'notices'"
        :failed="failedList === 'notices'"
        :effects-id="noticeEffectsId"
        :language="workspace.preferences.state.value.language"
        :secondary="state.result?.kind === 'thread'"
        :selection="state.selection"
        @load="workspace.loadNotices()"
      />
      <section
        v-if="state.result?.kind === 'directory' && directorySelected"
        v-show="sectionResultsVisible"
        id="thread-list-pane"
        class="overview pane"
        data-scroll-pane="overview"
        :aria-label="text.boardsOverview"
      >
        <div class="board-heading">
          <h1>{{ text.boards }}</h1>
          <button
            class="icon-button"
            :aria-label="text.refresh"
            :title="text.refresh"
            :disabled="state.loading"
            @click="workspace.refresh()"
          >
            <WorkspaceIcon name="refresh" />
          </button>
        </div>
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
          :key="group.key"
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
              data-category="neutral"
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
        v-show="resultsVisible && boardResultsAvailable"
        id="thread-list-pane"
        class="results-pane pane"
        :class="{
          'secondary-results': state.result?.kind === 'thread',
          'board-thread-list': true,
        }"
        data-scroll-pane="results"
        :aria-label="text.threadResults"
      >
        <div class="board-heading board-identity">
          <span
            class="board-symbol"
            :data-category="listCategory.role"
            aria-hidden="true"
          >
            <WorkspaceIcon name="boards" />
          </span>
          <div>
            <span
              v-if="listCategory.label"
              class="category-label"
              :data-category="listCategory.role"
              >{{ listCategory.label }}</span
            >
            <h1>{{ boardContext.title }}</h1>
          </div>
        </div>
        <BoardWritingActions
          :workspace="workspace"
          :portal="portal"
          :board-id="boardContext.id"
          :board-result="state.result?.kind === 'board'"
        />
        <CollapsibleRoot v-model:open="boardAboutOpen" class="board-about">
          <CollapsibleTrigger class="board-about-trigger">
            <WorkspaceIcon name="disclosure" />
            {{ text.aboutBoard
            }}<span v-if="boardContext.boards.length">
              · {{ boardContext.boards.length }}
              {{ text.subordinateBoards }}</span
            >
          </CollapsibleTrigger>
          <CollapsibleContent class="board-about-content">
            <p v-if="boardContext.statistics" class="board-statistics">
              {{ boardContext.statistics }}
            </p>
            <p v-if="!boardContext.statistics && !boardContext.boards.length">
              {{ text.boardInformationUnavailable }}
            </p>
            <section v-if="boardContext.boards.length">
              <h2>{{ text.subordinateBoards }}</h2>
              <div class="board-grid">
                <a
                  v-for="board in boardContext.boards"
                  :key="board.url"
                  :href="board.url"
                  :aria-label="board.label"
                  class="board-card"
                  :data-category="categoryFor(board.id).role"
                  ><strong>{{ board.label }}</strong
                  ><span v-if="board.description">{{ board.description }}</span
                  ><small v-if="board.stats">{{ board.stats }}</small></a
                >
              </div>
            </section>
          </CollapsibleContent>
        </CollapsibleRoot>
        <div class="board-list-controls">
          <button
            ref="filterTrigger"
            class="filter-trigger"
            :aria-label="`${text.boardFilters} · ${boardContext.criteria.length}`"
            :title="`${text.boardFilters} · ${boardContext.criteria.length}`"
            :aria-expanded="filtersOpen"
            @click="openFilters"
          >
            <WorkspaceIcon name="filter" />
            <span aria-hidden="true"
              >{{ text.boardFilters
              }}<template v-if="boardContext.criteria.length">
                · {{ boardContext.criteria.length }}</template
              ></span
            >
          </button>
          <button
            v-if="pinnedRows.length"
            class="pin-disclosure"
            :aria-label="`${text.pinnedThreads} · ${pinnedRows.length}`"
            :title="`${text.pinnedThreads} · ${pinnedRows.length}`"
            :aria-expanded="pinsExpanded"
            :aria-controls="
              pinnedRows.map((row) => `row-${row.rowId}`).join(' ')
            "
            @click="pinsExpanded = !pinsExpanded"
          >
            <WorkspaceIcon name="pin" />
            <span aria-hidden="true"
              >{{ pinnedRows.length }} {{ text.pinned }}</span
            >
          </button>
          <button
            class="icon-button"
            :aria-label="text.checkNewThreads"
            :title="text.checkNewThreads"
            :disabled="
              boardChecks.checking ||
              boardChecks.retryMinutes > 0 ||
              !workspace.boardChecks.canCheck()
            "
            @click="workspace.boardChecks.check()"
          >
            <WorkspaceIcon name="refresh" />
          </button>
          <span
            class="board-page-indicator"
            role="img"
            :aria-label="`${text.page} ${boardContext.pages.current}`"
            :title="`${text.page} ${boardContext.pages.current}`"
          >
            <WorkspaceIcon name="page" />
            <span aria-hidden="true"
              >{{ text.page }} {{ boardContext.pages.current }}</span
            >
          </span>
        </div>
        <div
          v-if="
            boardChecks.checking ||
            boardChecks.failure ||
            boardChecks.arrivals.length ||
            !workspace.boardChecks.canCheck()
          "
          class="board-check-status"
          aria-live="polite"
        >
          <span>{{
            boardChecks.checking
              ? text.boardChecking
              : boardChecks.failure
                ? text.boardCheckFailed
                : !workspace.boardChecks.canCheck()
                  ? text.boardCheckUnavailable
                  : ""
          }}</span>
          <div class="board-check-actions">
            <button
              v-if="boardChecks.failure"
              :disabled="
                boardChecks.checking ||
                boardChecks.retryMinutes > 0 ||
                !workspace.boardChecks.canCheck()
              "
              @click="workspace.boardChecks.check()"
            >
              {{ text.retryCheck }}
            </button>
            <button
              v-if="boardChecks.arrivals.length"
              @click="workspace.boardChecks.reveal()"
            >
              {{
                insert(
                  boardContext.pages.current !== "1"
                    ? text.showNewThreadsFirst
                    : boardChecks.arrivals.length === 1
                      ? text.showNewThread
                      : text.showNewThreads,
                  String(boardChecks.arrivals.length),
                )
              }}
            </button>
            <details
              v-if="boardChecks.failure"
              class="board-check-details"
              @keydown.esc.stop="closeCheckDetails"
            >
              <summary
                :aria-label="text.checkDetails"
                :title="text.checkDetails"
              >
                <WorkspaceIcon name="about" />
              </summary>
              <div class="board-check-explanation">
                <p>
                  {{
                    boardChecks.failure && "message" in boardChecks.failure
                      ? boardChecks.failure.message
                      : text.boardCheckFailed
                  }}
                </p>
                <p v-if="boardChecks.retryMinutes">
                  {{
                    insert(text.boardRetry, String(boardChecks.retryMinutes))
                  }}
                </p>
              </div>
            </details>
          </div>
        </div>
        <div v-if="boardContext.criteria.length" class="board-active-criteria">
          <ul :aria-label="text.criteria">
            <li
              v-for="criterion in boardContext.criteria"
              :key="criterion.label"
            >
              {{ criterion.label }}
            </li>
          </ul>
          <a
            v-if="boardContext.clearFilter"
            :href="boardContext.clearFilter.url"
            >{{ text.filterClear }}</a
          >
        </div>
        <div
          v-for="row in boardContext.threads"
          v-show="!row.pinned || pinsExpanded"
          :id="`row-${row.rowId}`"
          :key="row.rowId"
          class="thread-row"
          :data-thread-id="row.id"
        >
          <span
            v-if="workspace.writing.localReplyThreads.value.includes(row.id)"
            class="local-reply-indicator"
            >{{ text.localReplyDraft }}</span
          ><span v-if="row.pinned">{{ text.pinned }}</span
          ><span v-if="row.moved">{{ text.moved }}</span
          ><span v-if="row.category" class="thread-category">{{
            row.category
          }}</span
          ><a
            :href="row.url"
            class="subject"
            :aria-current="
              (state.selection ?? selectedThread) === row.id
                ? 'true'
                : undefined
            "
            >{{ row.label }}</a
          >
          <CollapsibleRoot class="thread-row-footer">
            <component
              :is="row.lastPost ? 'a' : 'span'"
              :href="row.lastPost?.url"
              class="latest-reply"
              :aria-label="
                row.lastPost
                  ? `${insert(text.openLatestPostIn, row.label)}: ${row.latestReply?.author || text.latestAuthorUnavailable} · ${row.latestReply?.time || text.latestTimeUnavailable}`
                  : undefined
              "
            >
              {{ row.latestReply?.author || text.latestAuthorUnavailable }} ·
              {{
                row.latestReply?.time || text.latestTimeUnavailable
              }}</component
            >
            <CollapsibleTrigger
              class="thread-details-trigger"
              :aria-label="`${insert(text.threadDetailsFor, row.label)}: ${row.replies || text.metadataUnavailable} ${text.replies}`"
              >{{ row.replies || text.metadataUnavailable }} {{ text.replies }}
              <span aria-hidden="true">▾</span></CollapsibleTrigger
            >
            <CollapsibleContent as="dl" class="thread-row-details">
              <dt>{{ text.replies }}</dt>
              <dd>{{ row.replies || text.metadataUnavailable }}</dd>
              <dt>{{ text.threadStartedBy }}</dt>
              <dd>{{ row.author || text.metadataUnavailable }}</dd>
              <dt>{{ text.threadStarted }}</dt>
              <dd>{{ row.date || text.metadataUnavailable }}</dd>
              <dt>{{ text.views }}</dt>
              <dd>{{ row.views || text.metadataUnavailable }}</dd>
              <dt>{{ text.threadIdentity }}</dt>
              <dd>{{ row.id }}</dd>
            </CollapsibleContent>
          </CollapsibleRoot>
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
          threadWithoutResults || (primaryThreadsList && !boardResultsAvailable)
        "
        v-show="resultsVisible"
        id="thread-list-pane"
        class="results-placeholder pane"
        :aria-label="text.threadResults"
      >
        <h2>{{ text.threadResults }}</h2>
        <p>{{ text.chooseThreadContext }}</p>
        <a v-if="reading?.thread.parent" :href="reading.thread.parent.url">{{
          reading.thread.parent.label
        }}</a>
        <button v-else-if="primaryThreadsList" @click="selectSection('boards')">
          {{ text.allBoards }}
        </button>
      </section>
      <div
        v-show="conversationVisible"
        ref="conversationRegion"
        class="conversation-region"
        :class="{
          'writing-wide': writingWide,
          'reply-editing-expanded':
            writing.visible &&
            writingExpanded &&
            ['reply', 'quick-quote'].includes(writing.context?.action ?? ''),
        }"
        :data-writing-visible="!!writing.context && writing.visible"
      >
        <section
          v-if="!reading && !state.privateReading && !pendingPrivate"
          class="reader-placeholder pane"
        >
          <p v-if="!personalCanvas">{{ text.chooseThreadContext }}</p>
          <ReplySends
            v-if="
              writing.context &&
              ['reply', 'quick-quote'].includes(writing.context.action) &&
              writing.context.replyTarget
            "
            :workspace="workspace"
            :thread-id="writing.context.replyTarget.threadId"
            :portal="portal"
          />
        </section>
        <section
          v-if="pendingPrivate"
          class="reading-pane pane"
          :aria-label="text.privateContext"
        >
          <h1>{{ text.privateContext }}</h1>
          <p>{{ insert(text.privateRecipientId, privateRecipientId) }}</p>
          <p :id="privateArrivalEffectsId">{{ text.privateReadEffects }}</p>
          <p>{{ text.privateArrivalEffects }}</p>
          <button
            :aria-describedby="privateArrivalEffectsId"
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
          :automatic="privateHistory.automatic"
          :paused="privateHistory.paused"
          :retry-minutes="privateHistory.retryMinutes"
          :checking="privateHistory.checking"
          :checked-at="privateHistory.checkedAt"
          :refresh-failure="privateHistory.refreshFailure"
          :arrivals="privateHistory.arrivals.length"
          :has-writing="!!writing.context"
          :language="workspace.preferences.state.value.language"
          @scroll="approachHistory"
          @automatic="workspace.privateHistory.setAutomatic($event)"
          @refresh="workspace.privateHistory.refresh()"
          @arrivals="workspace.privateHistory.revealArrivals()"
          @load="workspace.privateHistory.load($event)"
          @write="
            workspace.writing.preparePrivate(
              state.privateReading.conversation.url,
              state.privateReading.account,
            )
          "
        />
        <div
          v-if="reading"
          ref="readerHeading"
          class="conversation-heading"
          :data-compact="compactTitle"
          :data-keep-breadcrumb="keepBreadcrumb"
        >
          <div class="reader-heading-row">
            <section class="thread-heading">
              <div
                class="context-kind reader-breadcrumb"
                :data-category="readerCategory.role"
                @focusin="retainBreadcrumb"
              >
                <span :class="{ 'sr-only': reading.thread.parent }"
                  >{{ text.thread }} {{ reading.thread.id }}</span
                >
                <span
                  v-if="readerCategory.label"
                  class="category-label"
                  :data-category="readerCategory.role"
                  >{{ readerCategory.label }}</span
                >
                <a
                  v-if="reading.thread.parent"
                  :href="reading.thread.parent.url"
                  class="board-context-link"
                  :data-category="readerCategory.role"
                  >{{ reading.thread.parent.label }}</a
                >
              </div>
              <h1 :title="reading.thread.title">{{ reading.thread.title }}</h1>
            </section>
            <ThreadTools
              :workspace="workspace"
              :portal="portal"
              :thread="reading.thread"
              :position="readingPage"
              :filters="threadFilters"
              @refresh="
                state.result?.kind === 'thread'
                  ? workspace.refresh()
                  : workspace.threadHistory.refresh()
              "
            />
          </div>
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
          @scroll.passive="readingScroll"
        >
          <div
            class="thread-heading-spacer"
            aria-hidden="true"
            :style="{ height: titleSpace + 'px' }"
          />
          <div
            v-if="
              history.checking ||
              history.refreshFailure ||
              history.arrivals.length
            "
            class="history-controls public-history-controls"
            :aria-label="text.threadHistory"
          >
            <div class="public-check-row">
              <p class="public-check-state" role="status">
                {{
                  history.checking
                    ? text.refreshChecking
                    : history.refreshFailure
                      ? history.retryMinutes
                        ? insert(text.checkCooldown, history.retryMinutes)
                        : text.checkFailed
                      : ""
                }}
              </p>
              <div class="public-check-actions">
                <button
                  v-if="history.refreshFailure"
                  :disabled="
                    history.checking ||
                    history.retryMinutes > 0 ||
                    !workspace.threadHistory.canCheck()
                  "
                  @click="workspace.threadHistory.checkNewest()"
                >
                  {{ text.retryCheck }}
                </button>
                <button
                  v-if="history.arrivals.length"
                  @click="workspace.threadHistory.revealArrivals()"
                >
                  {{ insert(text.newReplies, history.arrivals.length) }}
                </button>
                <details
                  v-if="
                    history.refreshFailure &&
                    'message' in history.refreshFailure
                  "
                  @keydown.esc.stop="closeCheckDetails"
                >
                  <summary
                    :aria-label="text.checkDetails"
                    :title="text.checkDetails"
                  >
                    <WorkspaceIcon name="about" />
                  </summary>
                  <p>{{ text.checkRetry }}</p>
                  <p>
                    {{
                      description(
                        history.refreshFailure.message,
                        workspace.preferences.state.value.language,
                      )
                    }}
                  </p>
                </details>
              </div>
            </div>
          </div>
          <ThreadHistoryBoundary
            v-if="!reverseReading"
            :workspace="workspace"
            direction="earlier"
          />
          <template v-for="post in visiblePosts" :key="post.id">
            <ThreadHistoryBoundary
              v-if="reverseReading && post.id === newestReplyId"
              :workspace="workspace"
              direction="later"
            />
            <button
              v-if="
                reverseReading &&
                history.later.status === 'end' &&
                post.id === newestReplyId
              "
              class="newest-check"
              :aria-label="text.checkNewPosts"
              :title="text.checkNewPosts"
              :disabled="
                history.checking || history.retryMinutes > 0 || state.loading
              "
              @click="workspace.threadHistory.checkNewest()"
            >
              <WorkspaceIcon name="refresh" />
            </button>
            <article
              :id="`pid${post.id}`"
              :aria-label="`${text.post} ${post.id}`"
              :data-targeted="reading.thread.target === post.id"
              tabindex="-1"
              @contextmenu="postMenus.get(post.id)?.openMenu($event)"
              @dblclick="postMenus.get(post.id)?.emptyDoubleClick($event)"
            >
              <header class="post-header">
                <span
                  class="avatar"
                  :data-category="readerCategory.role"
                  aria-hidden="true"
                  >{{ Array.from(post.author.trim())[0] ?? "" }}</span
                >
                <div class="post-identity">
                  <strong class="post-author">{{ post.author }}</strong>
                  <div class="post-metadata">
                    <time>{{ post.date }}</time
                    ><span
                      >{{ text.floor }} {{ post.floor || text.unknown }}</span
                    >
                  </div>
                </div>
                <PostPermalink
                  :workspace="workspace"
                  :portal="portal"
                  :post-id="post.id"
                  :url="post.url"
                  :thread-id="reading.thread.id"
                  :thread-url="reading.thread.url"
                />
                <PostActions
                  :ref="
                    (value) => {
                      if (value)
                        postMenus.set(
                          post.id,
                          value as InstanceType<typeof PostActions>,
                        );
                      else postMenus.delete(post.id);
                    }
                  "
                  :workspace="workspace"
                  :portal="portal"
                  :post="post"
                  :thread-id="reading.thread.id"
                  :board-id="
                    reading.thread.parent
                      ? boardIdFrom(reading.thread.parent.url)
                      : null
                  "
                />
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
              <ul
                v-if="post.attachments?.length"
                :aria-label="text.attachments"
              >
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
                    <p
                      :role="download.status === 'failure' ? 'alert' : 'status'"
                    >
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
          </template>
          <ThreadHistoryBoundary
            :workspace="workspace"
            :direction="reverseReading ? 'earlier' : 'later'"
          />
          <ReplySends
            :workspace="workspace"
            :thread-id="reading.thread.id"
            :portal="portal"
          />
          <button
            v-if="!reverseReading && history.later.status === 'end'"
            class="newest-check"
            :aria-label="text.checkNewPosts"
            :title="text.checkNewPosts"
            :disabled="
              history.checking || history.retryMinutes > 0 || state.loading
            "
            @click="workspace.threadHistory.checkNewest()"
          >
            <WorkspaceIcon name="refresh" />
          </button>
        </section>
        <Teleport
          :to="browsingWritingStatus ?? portal"
          :disabled="conversationVisible || !browsingWritingStatus"
        >
          <div class="conversation-status">
            <div
              v-if="
                writing.preparing ||
                writing.message ||
                writing.privateReplacement ||
                writing.editReplacement ||
                writing.replacement ||
                writing.draftReplacement
              "
              class="writing-actions"
            >
              <p v-if="writing.preparing" role="status">
                {{ text.preparingForm }}
              </p>
              <p
                v-if="
                  writing.message &&
                  !(
                    writing.visible &&
                    writing.context?.action === 'private-message'
                  )
                "
                role="alert"
              >
                {{
                  description(
                    writing.message,
                    workspace.preferences.state.value.language,
                  )
                }}
              </p>
              <section v-if="writing.privateReplacement" role="alert">
                <p>
                  {{
                    privateWritingText(
                      "Replace current writing with a private message? Its unsent text will be discarded; original attempts remain available.",
                      workspace.preferences.state.value.language,
                    )
                  }}
                </p>
                <button @click="workspace.writing.cancelPrivateReplacement()">
                  {{ text.keepCurrentWriting }}
                </button>
                <button @click="workspace.writing.replaceWithPrivate()">
                  {{
                    privateWritingText(
                      "Discard and write private message",
                      workspace.preferences.state.value.language,
                    )
                  }}
                </button>
              </section>
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
              <p v-if="!writing.accountVerified" role="alert">
                {{
                  workspace.writing.currentActor.value
                    ? text.sharedReplyPaused
                    : insert(
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
        </Teleport>
        <div
          v-if="
            reading &&
            (reading.thread.parent || resumeReply) &&
            !writing.visible
          "
          class="composer-entry"
        >
          <button
            v-if="resumeReply"
            ref="replyEntry"
            @click="workspace.writing.show()"
          >
            {{ text.returnWriting }}
          </button>
          <WritingDestination
            v-if="resumeReply && writing.context"
            :writing="writing.context"
            :current-actor="workspace.writing.currentActor.value"
            :language="workspace.preferences.state.value.language"
            :category="writingCategory"
            compact
          />
          <button
            v-else-if="reading.thread.parent"
            ref="replyEntry"
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
        <div
          v-if="state.privateReading && !writing.context"
          class="composer-entry"
        >
          <span class="composer-caption">{{
            privateWritingText(
              "To {value}",
              workspace.preferences.state.value.language,
            ).replace("{value}", state.privateReading.conversation.peerName)
          }}</span>
          <button
            @click="
              workspace.writing.preparePrivate(
                state.privateReading.conversation.url,
                state.privateReading.account,
              )
            "
          >
            {{
              privateWritingText(
                "Write private message",
                workspace.preferences.state.value.language,
              )
            }}
          </button>
        </div>
        <SourceWriting
          v-if="writing.context"
          v-show="writing.visible"
          :key="writing.context.id"
          :workspace="workspace"
          :portal="portal"
          :expanded="writingExpanded"
          :elsewhere="writingElsewhere"
          :category="writingCategory"
          @resize="resizeWriting"
          @park="parkReply"
        />
      </div>
    </main>
    <div ref="browsingWritingStatus" class="browsing-writing-status" />
    <div
      v-if="
        writing.context &&
        ((browsingCanvas && !conversationVisible) ||
          (!writing.visible && !ownsHiddenReply)) &&
        !workspace.writing.replyParked.value
      "
      class="bottom-resume"
    >
      <button
        @click="
          browsingCanvas ? resumeCanvasWriting() : workspace.writing.show()
        "
      >
        <WorkspaceIcon name="compose" />
        {{ text.returnWriting }}
      </button>
      <div class="resume-destination">
        <WritingDestination
          :writing="writing.context"
          :current-actor="workspace.writing.currentActor.value"
          :language="workspace.preferences.state.value.language"
          :category="writingCategory"
          compact
        />
        <p v-if="writingElsewhere" role="status">{{ text.writingElsewhere }}</p>
      </div>
    </div>
    <nav
      v-if="!boardsDocked"
      ref="primaryNavigation"
      class="destination-bar"
      :aria-label="text.mainDestinations"
    >
      <button
        :aria-current="
          currentPrimaryDestination === 'boards' ? 'page' : undefined
        "
        @click="selectSection('boards')"
      >
        <WorkspaceIcon name="boards" /><span>{{ text.boards }}</span>
      </button>
      <button
        :aria-current="
          currentPrimaryDestination === 'threads' ? 'page' : undefined
        "
        @click="selectPrimaryThreads"
      >
        <WorkspaceIcon name="threads" /><span>{{
          text.destinationThreads
        }}</span>
      </button>
      <button
        :aria-current="
          currentPrimaryDestination === 'messages' ? 'page' : undefined
        "
        @click="selectSection('messages')"
      >
        <WorkspaceIcon name="messages" /><span>{{ text.messages }}</span>
      </button>
      <button
        ref="moreTrigger"
        aria-haspopup="dialog"
        :aria-expanded="destinationsOpen"
        :aria-current="
          currentPrimaryDestination === 'more' ? 'page' : undefined
        "
        @click="changeDestinations(true)"
      >
        <WorkspaceIcon name="more" /><span>{{ text.destinationMore }}</span>
      </button>
    </nav>
  </div>
</template>
