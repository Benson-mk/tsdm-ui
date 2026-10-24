import type { PreferenceHost } from "../workspace/preferences";
const key = "tsdm.workspace.preferences";
export function createBrowserPreferences(): PreferenceHost {
  return {
    load() {
      try {
        const raw = localStorage.getItem(key);
        let value: unknown = null;
        try {
          value = raw === null ? null : JSON.parse(raw);
        } catch {
          /* Invalid preferences use the baseline. */
        }
        const incompatible =
          raw !== null &&
          (!value ||
            typeof value !== "object" ||
            !("schema" in value) ||
            value.schema !== 1);
        return {
          value,
          available: true,
          ...(incompatible ? { incompatibleRaw: raw } : {}),
        };
      } catch {
        return { value: null, available: false };
      }
    },
    save(value) {
      try {
        const snapshot = JSON.stringify(value);
        localStorage.setItem(key, snapshot);
        return localStorage.getItem(key) === snapshot;
      } catch {
        return false;
      }
    },
  };
}
