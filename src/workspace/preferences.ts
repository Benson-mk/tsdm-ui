import { readonly, shallowRef } from "vue";

export interface Preferences {
  schema: 1;
  theme: "light" | "alias" | "mono" | "dark";
  textSize: number;
  language: "en" | "zh-CN" | "zh-TW";
}
export interface PreferenceHost {
  load(): { value: unknown; available: boolean; incompatibleRaw?: string };
  save(value: Preferences): boolean;
}
const defaults: Preferences = {
  schema: 1,
  theme: "light",
  textSize: 100,
  language: "en",
};
function normalize(value: unknown): Preferences {
  if (
    !value ||
    typeof value !== "object" ||
    !("schema" in value) ||
    value.schema !== 1
  )
    return { ...defaults };
  const candidate = value as Record<string, unknown>;
  return {
    schema: 1,
    theme:
      candidate.theme === "alias" ||
      candidate.theme === "mono" ||
      candidate.theme === "dark"
        ? candidate.theme
        : "light",
    language:
      candidate.language === "zh-CN" || candidate.language === "zh-TW"
        ? candidate.language
        : "en",
    textSize:
      typeof candidate.textSize === "number" &&
      Number.isInteger(candidate.textSize) &&
      candidate.textSize >= 70 &&
      candidate.textSize <= 150 &&
      candidate.textSize % 10 === 0
        ? candidate.textSize
        : 100,
  };
}
export function createPreferences(host: PreferenceHost) {
  const loaded = host.load();
  const state = shallowRef<Preferences>(normalize(loaded.value));
  const incompatibleRaw = shallowRef<string | null>(
    loaded.incompatibleRaw ?? null,
  );
  const resetFailed = shallowRef(false);
  const persistent = shallowRef(
    loaded.available && incompatibleRaw.value === null,
  );
  function set(update: Partial<Omit<Preferences, "schema">>) {
    state.value = normalize({ ...state.value, ...update });
    persistent.value = incompatibleRaw.value === null && host.save(state.value);
  }
  return {
    state: readonly(state),
    persistent: readonly(persistent),
    incompatibleRaw: readonly(incompatibleRaw),
    resetFailed: readonly(resetFailed),
    resetIncompatible() {
      if (incompatibleRaw.value === null) return;
      persistent.value = host.save(state.value);
      resetFailed.value = !persistent.value;
      if (persistent.value) incompatibleRaw.value = null;
    },
    set,
    setTextSize: (textSize: number) => set({ textSize }),
  };
}
