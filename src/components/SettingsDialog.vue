<script setup lang="ts">
import { computed, ref } from "vue";
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
import type { Workspace } from "../workspace";
import { strings } from "../layouts/strings";
const props = defineProps<{ workspace: Workspace; portal: HTMLElement }>();
const preferences = props.workspace.preferences;
const state = preferences.state;
const open = ref(false);
const confirmPreferenceReset = ref(false);
function changeOpen(value: boolean) {
  const change = () => {
    open.value = value;
  };
  if (!props.workspace.writing.deferViewChange(change)) change();
}
const text = computed(() => strings(state.value.language));
const themes = ["light", "alias", "mono", "dark"] as const;
function language(event: Event) {
  if (!(event.target instanceof HTMLSelectElement)) return;
  const value = event.target.value;
  if (value === "en" || value === "zh-CN" || value === "zh-TW")
    preferences.set({ language: value });
}
function input(event: Event) {
  if (event.target instanceof HTMLInputElement)
    preferences.setTextSize(Number(event.target.value));
}
function escape(event: KeyboardEvent) {
  if (event.defaultPrevented) return;
  event.stopPropagation();
  open.value = false;
}
</script>
<template>
  <DialogRoot :open="open" @update:open="changeOpen">
    <DialogTrigger>{{ text.settings }}</DialogTrigger>
    <DialogPortal :to="portal">
      <DialogOverlay class="dialog-overlay" />
      <DialogContent
        class="dialog-content settings-dialog"
        @keydown.esc="escape"
      >
        <DialogTitle>{{ text.settings }}</DialogTitle>
        <DialogDescription>{{ text.settingsDescription }}</DialogDescription>
        <label for="text-size">{{ text.textSize }}</label>
        <input
          id="text-size"
          type="range"
          min="70"
          max="150"
          step="10"
          :value="state.textSize"
          @input="input"
        />
        <p role="status">
          {{ state.textSize }}% ·
          {{ state.textSize < 100 ? text.compact : text.default }}
          {{ text.spacing }}
        </p>
        <button @click="preferences.setTextSize(100)">{{ text.reset }}</button>
        <fieldset class="theme-choices">
          <legend>{{ text.theme }}</legend>
          <label v-for="theme in themes" :key="theme">
            <input
              type="radio"
              name="theme"
              :value="theme"
              :checked="state.theme === theme"
              @change="preferences.set({ theme })"
            />
            <span
              class="theme-swatch"
              :data-swatch="theme"
              aria-hidden="true"
            ></span>
            {{ theme.charAt(0).toUpperCase() + theme.slice(1) }}
          </label>
        </fieldset>
        <label for="interface-language">{{ text.language }}</label>
        <select
          id="interface-language"
          :value="state.language"
          @change="language"
        >
          <option value="en">English</option>
          <option value="zh-CN">简体中文</option>
          <option value="zh-TW">繁體中文</option>
        </select>
        <section v-if="preferences.incompatibleRaw.value !== null">
          <p role="alert">{{ text.incompatiblePreferences }}</p>
          <p v-if="preferences.resetFailed.value" role="alert">
            {{ text.preferencesResetFailed }}
          </p>
          <label for="retained-preferences">{{
            text.retainedPreferences
          }}</label>
          <textarea
            id="retained-preferences"
            readonly
            :value="preferences.incompatibleRaw.value"
          />
          <button
            v-if="!confirmPreferenceReset"
            @click="confirmPreferenceReset = true"
          >
            {{ text.resetIncompatiblePreferences }}
          </button>
          <template v-else>
            <p>{{ text.discardPreferencesWarning }}</p>
            <button
              @click="
                preferences.resetIncompatible();
                confirmPreferenceReset = false;
              "
            >
              {{ text.discardRetainedPreferences }}
            </button>
            <button @click="confirmPreferenceReset = false">
              {{ text.close }}
            </button>
          </template>
        </section>
        <p
          v-if="
            !preferences.persistent.value &&
            preferences.incompatibleRaw.value === null
          "
        >
          {{ text.storageUnavailable }}
        </p>
        <DialogClose>{{ text.close }}</DialogClose>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
