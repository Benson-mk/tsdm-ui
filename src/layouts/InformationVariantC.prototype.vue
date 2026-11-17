<script setup lang="ts">
// Variant C: choose in a dense index, then inspect before opening.
import { computed, ref, watch, type DeepReadonly } from "vue";
import type { ThreadRow } from "../forum-client";
const props = defineProps<{
  rows: DeepReadonly<ThreadRow[]>;
  selected: string | null;
  drafts: readonly string[];
}>();
const inspected = ref(props.selected ?? props.rows[0]?.id);
const row = computed(
  () => props.rows.find((item) => item.id === inspected.value) ?? props.rows[0],
);
watch(
  () => props.selected,
  (value) => {
    if (value) inspected.value = value;
  },
);
</script>
<template>
  <div class="prototype-index">
    <p class="prototype-section-caption">Choose a title, then open below</p>
    <div
      class="prototype-index-choices"
      role="region"
      aria-label="Thread title index"
      tabindex="0"
    >
      <div
        v-for="item in rows"
        :key="item.rowId"
        class="thread-row prototype-index-row"
        :data-thread-id="item.id"
      >
        <button
          :aria-pressed="row?.id === item.id"
          @click="inspected = item.id"
        >
          <span>{{ item.label }}</span
          ><small v-if="selected === item.id">Reading</small
          ><small v-else-if="drafts.includes(item.id)">Local reply</small
          ><small v-else>{{ item.replies || "—" }}</small>
        </button>
      </div>
    </div>
    <section
      v-if="row"
      class="prototype-inspector"
      aria-label="Selected thread details"
      aria-live="polite"
    >
      <span class="prototype-section-caption"
        >{{ row.category || "Discussion" }} · Selected for inspection</span
      >
      <h2>{{ row.label }}</h2>
      <span v-if="row.moved">Moved</span>
      <dl>
        <dt>Started by</dt>
        <dd>{{ row.author || "Unavailable" }}</dd>
        <dt>Started</dt>
        <dd>{{ row.date || "Unavailable" }}</dd>
        <dt>Replies / views</dt>
        <dd>
          {{ row.replies || "Unavailable" }} / {{ row.views || "Unavailable" }}
        </dd>
        <dt>Thread</dt>
        <dd>{{ row.id }}</dd>
      </dl>
      <a
        :href="row.url"
        class="prototype-open"
        :aria-current="selected === row.id ? 'true' : undefined"
        >Open thread <span aria-hidden="true">→</span></a
      >
      <a v-if="row.lastPost" :href="row.lastPost.url" class="prototype-latest"
        >Latest: {{ row.latestReply?.author || "Author unavailable" }} ·
        {{ row.latestReply?.time || "Time unavailable" }} ↗</a
      >
      <p v-else class="prototype-muted">Latest activity unavailable</p>
    </section>
  </div>
</template>
