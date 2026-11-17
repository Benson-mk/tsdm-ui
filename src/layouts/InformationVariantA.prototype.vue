<script setup lang="ts">
// Variant A: title is the primary affordance; history is disclosed per row.
import type { DeepReadonly } from "vue";
import type { ThreadRow } from "../forum-client";
defineProps<{
  rows: DeepReadonly<ThreadRow[]>;
  selected: string | null;
  drafts: readonly string[];
}>();
</script>
<template>
  <div class="prototype-summaries">
    <div
      v-for="row in rows"
      :key="row.rowId"
      class="thread-row prototype-summary"
      :data-thread-id="row.id"
    >
      <a
        :href="row.url"
        class="subject"
        :aria-current="selected === row.id ? 'true' : undefined"
        ><span class="prototype-inline-category">{{ row.category }}</span
        >{{ row.label }}</a
      >
      <span v-if="drafts.includes(row.id)" class="prototype-draft"
        >Local reply</span
      >
      <span v-if="row.moved">Moved</span>
      <div class="prototype-summary-footer">
        <a v-if="row.lastPost" :href="row.lastPost.url" class="prototype-latest"
          ><span>{{
            row.latestReply?.author || "Latest author unavailable"
          }}</span
          ><time>{{ row.latestReply?.time || "Time unavailable" }}</time
          ><span aria-hidden="true">↗</span></a
        >
        <p v-else class="prototype-muted">Latest activity unavailable</p>
        <details class="prototype-row-details prototype-summary-details">
          <summary
            :aria-label="`Details for ${row.label}, ${row.replies || 'unknown'} replies`"
          >
            {{ row.replies || "—" }} replies ▾
          </summary>
          <dl>
            <dt v-if="drafts.includes(row.id)">Writing</dt>
            <dd v-if="drafts.includes(row.id)">Local reply</dd>
            <dt v-if="row.moved">Location</dt>
            <dd v-if="row.moved">Moved</dd>
            <dt>Replies</dt>
            <dd>{{ row.replies || "Unavailable" }}</dd>
            <dt>Started by</dt>
            <dd>{{ row.author || "Unavailable" }}</dd>
            <dt>Started</dt>
            <dd>{{ row.date || "Unavailable" }}</dd>
            <dt>Views</dt>
            <dd>{{ row.views || "Unavailable" }}</dd>
            <dt>Thread</dt>
            <dd>{{ row.id }}</dd>
          </dl>
        </details>
      </div>
    </div>
  </div>
</template>
