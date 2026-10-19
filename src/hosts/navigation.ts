import type { NavigationHost } from "../workspace/navigation";
import { isNavigationRecord } from "./navigation-record";
const storageKey = "tsdm.workspace.recovery";
export function createBrowserNavigation(): NavigationHost {
  let saveQueue = Promise.resolve(true);
  const entryKey = () =>
    /^#workspace=([a-zA-Z0-9-]+)$/.exec(location.hash)?.[1] ?? null;
  const address = (key: string) =>
    `${location.origin}/forum.php#workspace=${key}`;
  return {
    entryKey,
    async load() {
      try {
        const raw = sessionStorage.getItem(storageKey);
        if (raw === null) return null;
        const value: unknown = JSON.parse(raw);
        return isNavigationRecord(value) ? value : null;
      } catch {
        return null;
      }
    },
    save(record) {
      let snapshot: string;
      try {
        snapshot = JSON.stringify(record);
      } catch {
        return Promise.resolve(false);
      }
      saveQueue = saveQueue.then(() => {
        try {
          sessionStorage.setItem(storageKey, snapshot);
          return sessionStorage.getItem(storageKey) === snapshot;
        } catch {
          return false;
        }
      });
      return saveQueue;
    },
    push(key) {
      history.pushState({ tsdmEntry: key }, "", address(key));
    },
    replace(key) {
      history.replaceState({ tsdmEntry: key }, "", address(key));
    },
    onPop(action) {
      window.addEventListener("popstate", () => action(entryKey()));
    },
    back() {
      history.back();
    },
    navigateDocument(url) {
      location.replace(url);
    },
  };
}

/** Recovery is available independently of Vue startup on safe opaque history entries. */
export async function recoverNavigationDestination(): Promise<string> {
  const host = createBrowserNavigation(),
    key = host.entryKey();
  if (!key) return location.href;
  const record = await host.load(),
    entry = record?.entries[key];
  if (entry && typeof entry.destination === "string") {
    try {
      const url = new URL(entry.destination);
      if (
        url.origin === location.origin &&
        url.protocol === "https:" &&
        !url.username &&
        !url.password
      )
        return url.href;
    } catch {
      /* Use safe overview below. */
    }
  }
  return `${location.origin}/forum.php`;
}
