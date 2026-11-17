<script setup lang="ts">
// Variant B: latest activity is primary; the title opens the beginning.
import type { DeepReadonly } from "vue";
import type { ThreadRow } from "../forum-client";
defineProps<{
  rows: DeepReadonly<ThreadRow[]>;
  selected: string | null;
  drafts: readonly string[];
}>();
</script>
<template>
  <div class="prototype-activity">
    <p class="prototype-section-caption">Latest activity · forum order</p>
    <div
      v-for="row in rows"
      :key="row.rowId"
      class="thread-row prototype-event"
      :data-thread-id="row.id"
    >
      <span class="prototype-event-dot" aria-hidden="true" />
      <a
        v-if="row.lastPost"
        :href="row.lastPost.url"
        class="prototype-event-primary"
        ><time>{{ row.latestReply?.time || "Time unavailable" }}</time
        ><strong>{{ row.latestReply?.author || "Author unavailable" }}</strong
        ><span>View latest reply ↗</span></a
      >
      <p v-else class="prototype-muted">Latest activity unavailable</p>
      <a
        :href="row.url"
        class="subject"
        :aria-current="selected === row.id ? 'true' : undefined"
        >{{ row.label }}</a
      >
      <span v-if="drafts.includes(row.id)" class="prototype-draft"
        >Local reply</span
      ><span v-if="row.moved">Moved</span>
      <details class="prototype-row-details">
        <summary>
          {{ row.category || "Discussion" }} · About this thread
        </summary>
        <dl>
          <dt>Started by</dt>
          <dd>{{ row.author || "Unavailable" }}</dd>
          <dt>Started</dt>
          <dd>{{ row.date || "Unavailable" }}</dd>
          <dt>Replies / views</dt>
          <dd>
            {{ row.replies || "Unavailable" }} /
            {{ row.views || "Unavailable" }}
          </dd>
          <dt>Thread</dt>
          <dd>{{ row.id }}</dd>
        </dl>
      </details>
    </div>
  </div>
</template>
