// Three information hierarchies on the existing board pane; ?variant=A|B|C.
import { createApp, ref } from "vue";
import { createForumClient, describeDestination } from "../forum-client";
import { createWorkspace } from "../workspace";
import type { NavigationHost, NavigationRecord } from "../workspace/navigation";
import Prototype from "./InformationHierarchy.prototype.vue";
import styles from "../styles.css?inline";
import prototypeStyles from "./information-hierarchy.prototype.css?inline";
import {
  boardURL,
  threadURL,
  origin,
  response,
  requests,
} from "./information-fixture.prototype";

if (import.meta.env.DEV) {
  const root = document.createElement("div");
  root.id = "tsdm-workspace";
  root.style.cssText = "position:fixed;inset:0;overflow:hidden";
  document.body.append(root);
  const shadow = root.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = styles + prototypeStyles;
  const mount = document.createElement("div");
  const portal = document.createElement("div");
  shadow.append(style, mount, portal);
  const note = ref("");
  let record: NavigationRecord | null = null;
  let key: string | null = null;
  const stack: string[] = [];
  let pop: (key: string | null) => void = () => {};
  const host: NavigationHost = {
    entryKey: () => key,
    recoveryProblem: () => null,
    resetRecovery: () => {
      record = null;
    },
    load: async () => record,
    save: async (value) => {
      record = JSON.parse(JSON.stringify(value));
      return true;
    },
    push: (value) => {
      if (key) stack.push(key);
      key = value;
    },
    replace: (value) => {
      key = value;
    },
    onPop: (action) => {
      pop = action;
    },
    back: () => {
      key = stack.pop() ?? null;
      pop(key);
    },
    navigateDocument: () => {
      note.value = "Native navigation is unavailable in this local prototype.";
    },
  };
  const workspace = createWorkspace(
    createForumClient({
      origin,
      transport: {
        request: async (url, request) =>
          response(url, request?.method ?? "GET", request?.body ?? null),
      },
    }),
    boardURL,
    host,
    {
      load: () => ({
        available: true,
        value: { schema: 1, theme: "light", textSize: 100, language: "en" },
      }),
      save: () => true,
    },
  );
  // Replace only host navigation: all reads still pass through the real parser/workspace.
  shadow.addEventListener(
    "click",
    (event) => {
      const link = event
        .composedPath()
        .find((node) => node instanceof HTMLAnchorElement);
      if (!(link instanceof HTMLAnchorElement) || !link.href.startsWith(origin))
        return;
      event.preventDefault();
      event.stopPropagation();
      const route = describeDestination(link.href);
      if (
        link.href.includes("tsdm-native") ||
        !route ||
        !["board", "thread", "directory"].includes(route.kind)
      ) {
        note.value =
          "This destination is outside the browsing prototype. No forum request was made.";
        return;
      }
      void workspace.openThread(
        link.href,
        link.closest("[data-thread-id]")?.getAttribute("data-thread-id") ??
          null,
      );
    },
    true,
  );
  shadow.addEventListener("auxclick", (event) => {
    event.preventDefault();
  });
  createApp(Prototype, {
    workspace,
    portal,
    note,
    requests,
    onDismiss: () => {
      note.value = "";
    },
  }).mount(mount);
  await workspace.start();
  await workspace.openThread(threadURL("42"), "42");
}
