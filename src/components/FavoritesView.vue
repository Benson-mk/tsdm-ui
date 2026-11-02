<script setup lang="ts">
import { type DeepReadonly } from "vue";
import { favoriteText } from "./favorite-labels";
import type { Preferences } from "../workspace/preferences";
import type { Favorites, FavoriteKind } from "../forum-client";
const props = defineProps<{
  favorites: DeepReadonly<Favorites> | null;
  loading: boolean;
  secondary: boolean;
  boardTarget: boolean;
  language: Preferences["language"];
}>();
const emit = defineEmits<{
  load: [kind: FavoriteKind];
  remove: [kind: FavoriteKind, targetId: string, recordId: string];
}>();
const t = (value: string) => favoriteText(value, props.language);
</script>
<template>
  <nav class="boards-navigation pane" :aria-label="t('Saved kinds')">
    <h2>{{ t("Saved") }}</h2>
    <button :disabled="loading" @click="emit('load', 'thread')">
      {{ t("Load saved threads") }}
    </button>
    <button :disabled="loading" @click="emit('load', 'forum')">
      {{ t("Load saved boards") }}
    </button>
  </nav>
  <section
    v-if="!boardTarget"
    class="overview pane favorites-pane"
    :class="{ 'secondary-results': secondary }"
    data-scroll-pane="overview"
  >
    <h1>{{ t("Saved") }}</h1>
    <h2 v-if="!favorites">{{ t("Saved boards and threads") }}</h2>
    <nav class="favorite-inline-kinds" :aria-label="t('Saved kinds')">
      <button :disabled="loading" @click="emit('load', 'thread')">
        {{ t("Load saved threads") }}
      </button>
      <button :disabled="loading" @click="emit('load', 'forum')">
        {{ t("Load saved boards") }}
      </button>
    </nav>
    <template v-if="favorites">
      <h2>
        {{ t(favorites.kind === "thread" ? "Threads" : "Boards") }}
      </h2>
      <p>{{ t("Page") }} {{ favorites.pages.current }}</p>
      <p v-if="!favorites.records.length">
        {{ t("No favorites on this page.") }}
      </p>
      <article
        v-for="record in favorites.records"
        :id="`favorite-${record.id}`"
        :key="record.id"
        :data-favorite-id="record.id"
        tabindex="-1"
      >
        <a v-if="record.url" :href="record.url">{{ record.title }}</a>
        <p v-else>{{ t(record.title) }}</p>
        <p v-if="record.unavailableText">{{ record.unavailableText }}</p>
        <time>{{ record.time }}</time>
        <p v-if="record.note">{{ record.note }}</p>
        <button
          v-if="record.removable"
          :disabled="loading"
          @click="emit('remove', record.kind, record.targetId, record.id)"
        >
          {{ t("Remove favorite") }}
        </button>
      </article>
      <nav :aria-label="t('Saved pages')">
        <a
          v-for="link in favorites.pages.links"
          :key="link.url"
          :href="link.url"
          >{{ link.label }}</a
        >
      </nav>
    </template>
  </section>
</template>
