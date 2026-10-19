import type { NavigationHost } from "../workspace/navigation";
import { isNavigationRecord } from "./navigation-record";
const storageKey = "tsdm.workspace.recovery";
export function createBrowserNavigation(): NavigationHost {
  let saveQueue = Promise.resolve(true);
  let problem: { kind: "incompatible" | "refused"; raw: string | null } | null =
    null;
  const entryKey = () =>
    /^#workspace=([a-zA-Z0-9-]+)$/.exec(location.hash)?.[1] ?? null;
  const address = (key: string) =>
    `${location.origin}/forum.php#workspace=${key}`;
  return {
    entryKey,
    recoveryProblem: () => problem,
    resetRecovery: () => {
      problem = null;
    },
    async load() {
      let raw: string | null = null;
      try {
        raw = sessionStorage.getItem(storageKey);
        if (raw === null) return null;
        let value: unknown;
        try {
          value = JSON.parse(raw);
        } catch {
          problem = { kind: "incompatible", raw };
          return null;
        }
        if (
          value &&
          typeof value === "object" &&
          "schema" in value &&
          value.schema === 1
        )
          value = { ...value, schema: 2, writing: null };
        if (isNavigationRecord(value)) return value;
        problem = { kind: "incompatible", raw };
        return null;
      } catch {
        problem = { kind: "refused", raw };
        return null;
      }
    },
    save(record) {
      if (problem?.kind === "incompatible") return Promise.resolve(false);
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
