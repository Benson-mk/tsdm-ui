<script setup lang="ts">
// Variant A: title is the primary affordance; history is disclosed per row.
import type { DeepReadonly } from "vue";
import {
  CollapsibleRoot,
  CollapsibleTrigger,
  CollapsibleContent,
} from "reka-ui";
import type { ThreadRow } from "../forum-client";
defineProps<{
  rows: DeepReadonly<ThreadRow[]>;
  selected: string | null;
  drafts: readonly string[];
}>();
</script>
<template>
  <div class="prototype-summaries">
    <CollapsibleRoot
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
      <div
        v-if="row.pinned || row.moved || drafts.includes(row.id)"
        class="prototype-row-flags"
      >
        <span v-if="row.pinned">Pinned</span>
        <span v-if="drafts.includes(row.id)">Local reply</span>
        <span v-if="row.moved">Moved</span>
      </div>
      <component
        :is="row.lastPost ? 'a' : 'div'"
        :href="row.lastPost?.url"
        class="prototype-latest"
      >
        <span class="prototype-latest-heading"
          >Latest activity<span v-if="row.lastPost" aria-hidden="true">
            ↗</span
          ></span
        >
        <span
          v-if="
            row.lastPost || row.latestReply?.author || row.latestReply?.time
          "
          class="prototype-latest-value"
        >
          <span>{{ row.latestReply?.author || "Author unavailable" }}</span>
          <time>{{ row.latestReply?.time || "Time unavailable" }}</time>
        </span>
        <span v-else>Unavailable</span>
      </component>
      <CollapsibleTrigger
        class="prototype-details-trigger"
        :aria-label="`Details for ${row.label}`"
      >
        <span class="prototype-reply-count">{{
          row.replies ? `${row.replies} replies` : "Replies unknown"
        }}</span>
        <span
          >Details
          <span class="prototype-details-chevron" aria-hidden="true"
            >⌄</span
          ></span
        >
      </CollapsibleTrigger>
      <CollapsibleContent as="dl" class="prototype-summary-metadata">
        <dt>Started by</dt>
        <dd>{{ row.author || "Unavailable" }}</dd>
        <dt>Started</dt>
        <dd>{{ row.date || "Unavailable" }}</dd>
        <dt>Views</dt>
        <dd>{{ row.views || "Unavailable" }}</dd>
        <dt>Thread</dt>
        <dd>{{ row.id }}</dd>
      </CollapsibleContent>
    </CollapsibleRoot>
  </div>
</template>
