import { createApp } from "vue";
import { createForumClient } from "./forum-client";
import {
  createBrowserTransport,
  nativeDestination,
  suspendNativeBackground,
} from "./hosts/browser";
import { createWorkspace } from "./workspace";
import WorkspaceLayout from "./layouts/WorkspaceLayout.vue";
import styles from "./styles.css?inline";
declare const GM_registerMenuCommand:
  undefined | ((label: string, action: () => void) => void);
const destination = new URL(location.href);
const recover = () => location.assign(nativeDestination(location.href));
if (typeof GM_registerMenuCommand === "function")
  GM_registerMenuCommand("Open this destination in native forum", recover);
if (
  destination.origin === "https://www.tsdm39.com" &&
  destination.pathname === "/forum.php" &&
  destination.searchParams.get("mod") === "viewthread" &&
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
    );
    createApp(WorkspaceLayout, { workspace, portal }).mount(mount);
    window.addEventListener("hashchange", () =>
      workspace.updateAnchor(location.hash),
    );
    restoreNative = suspendNativeBackground(root);
    void workspace.refresh();
  } catch {
    restoreNative();
    root.remove();
    const recovery = document.createElement("a");
    recovery.href = nativeDestination(location.href);
    recovery.addEventListener("click", () => {
      recovery.href = nativeDestination(location.href);
    });
    recovery.textContent =
      "Workspace could not start — continue in native forum";
    document.body.prepend(recovery);
  }
}
