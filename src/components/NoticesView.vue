<script setup lang="ts">
import { computed, type DeepReadonly } from "vue";
import type { Notices } from "../forum-client";
import type { Preferences } from "../workspace/preferences";
import { strings, insert } from "../layouts/strings";
import { nativeDestination } from "../hosts/browser";
import ContentView from "./ContentView";
const props = defineProps<{
  notices: DeepReadonly<Notices> | null;
  loading: boolean;
  language: Preferences["language"];
  secondary?: boolean;
  selection?: string | null;
}>();
const text = computed(() => strings(props.language));
const emit = defineEmits<{ load: [] }>();
</script>
<template>
  <section
    class="overview pane notices-pane"
    :class="{ 'secondary-results': secondary }"
    data-scroll-pane="overview"
    :aria-label="text.noticesOverviewLabel"
  >
    <h1>{{ text.notices }}</h1>
    <h2>{{ text.noticesHeading }}</h2>
    <p>{{ text.noticesOverview }}</p>
    <p>{{ text.noticeEffects }}</p>
    <button :disabled="loading" @click="emit('load')">
      {{ notices ? text.refreshNotices : text.loadNotices }}
    </button>
    <template v-if="notices">
      <p v-if="notices.unread.kind === 'observed'">
        {{ insert(text.noticeUnreadObserved, String(notices.unread.count)) }}
      </p>
      <p v-else>
        {{
          notices.unread.kind === "absent"
            ? text.noticeUnreadAbsent
            : text.noticeUnreadUnknown
        }}
      </p>
      <nav
        class="notices-inline-categories"
        :aria-label="text.noticeCategories"
      >
        <a
          v-for="category in notices.categories"
          :key="category.url"
          :href="category.url"
          :aria-current="category.current ? 'page' : undefined"
          >{{ category.label }}</a
        >
      </nav>
      <p>{{ text.page }} {{ notices.pages.current }}</p>
      <p v-if="notices.empty">{{ notices.empty }}</p>
      <article
        v-for="notice in notices.entries"
        :id="`notice-${notice.id}`"
        :key="notice.id"
        :data-notice-id="notice.id"
        :aria-current="selection === notice.id ? 'true' : undefined"
        tabindex="-1"
      >
        <header>
          <time>{{ notice.time }}</time>
        </header>
        <ContentView :nodes="notice.body" :language="language" native-links />
      </article>
      <nav :aria-label="text.noticePages">
        <a
          v-for="link in notices.pages.links"
          :key="link.url"
          :href="link.url"
          >{{ link.label }}</a
        >
      </nav>
    </template>
    <p>{{ text.deferredNotices }}</p>
    <nav :aria-label="text.native">
      <a
        :href="
          nativeDestination('https://www.tsdm39.com/home.php?mod=space&do=pm')
        "
        >{{ text.nativePM }}</a
      >
      <a
        :href="
          nativeDestination(
            'https://www.tsdm39.com/home.php?mod=space&do=notice',
          )
        "
        >{{ text.nativeNotices }}</a
      >
    </nav>
  </section>
</template>
