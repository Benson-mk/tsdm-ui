import { createApp } from "vue";
import { createForumClient, describeDestination } from "./forum-client";
import {
  createBrowserTransport,
  nativeDestination,
  suspendNativeBackground,
} from "./hosts/browser";
import {
  createBrowserNavigation,
  recoverNavigationDestination,
} from "./hosts/navigation";
import { createWorkspace } from "./workspace";
import WorkspaceLayout from "./layouts/WorkspaceLayout.vue";
import styles from "./styles.css?inline";
declare const GM_registerMenuCommand:
  undefined | ((label: string, action: () => void) => void);
const destination = new URL(location.href);
let recover = async () =>
  location.assign(nativeDestination(await recoverNavigationDestination()));
if (typeof GM_registerMenuCommand === "function")
  GM_registerMenuCommand("Open this destination in native forum", () =>
    recover(),
  );
if (
  destination.origin === "https://www.tsdm39.com" &&
  (describeDestination(destination.href) ||
    (destination.pathname === "/forum.php" &&
      ["viewthread", "forumdisplay", "redirect"].includes(
        destination.searchParams.get("mod") ?? "",
      ))) &&
  !destination.searchParams.has("tsdm-native") &&
  !document.getElementById("tsdm-workspace")
) {
  const root = document.createElement("div");
  root.id = "tsdm-workspace";
  root.style.cssText =
    "position:fixed;inset:0;overflow:auto;z-index:2147483600;background:#fff";
  const shadow = root.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = styles;
  const mount = document.createElement("div");
  const portal = document.createElement("div");
  shadow.append(style, mount, portal);
  document.body.append(root);
  let restoreNative = () => {};
  try {
    const workspace = createWorkspace(
      createForumClient({
        origin: destination.origin,
        transport: createBrowserTransport(),
      }),
      destination.href,
      createBrowserNavigation(),
    );
    recover = async () =>
      location.assign(nativeDestination(workspace.state.value.destination));
    createApp(WorkspaceLayout, { workspace, portal }).mount(mount);
    window.addEventListener("hashchange", () =>
      workspace.updateAnchor(location.hash),
    );
    restoreNative = suspendNativeBackground(root);
    void workspace.start();
  } catch {
    restoreNative();
    root.remove();
    const recovery = document.createElement("a");
    recovery.href = nativeDestination(location.href);
    recovery.addEventListener("click", (event) => {
      event.preventDefault();
      void recover();
    });
    recovery.textContent =
      "Workspace could not start — continue in native forum";
    document.body.prepend(recovery);
  }
}
