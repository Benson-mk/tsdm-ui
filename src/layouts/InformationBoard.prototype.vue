<script setup lang="ts">
import { computed, ref, type DeepReadonly } from "vue";
import type { Board } from "../forum-client";
import WorkspaceIcon from "../components/WorkspaceIcon.vue";
import VariantA from "./InformationVariantA.prototype.vue";
import VariantB from "./InformationVariantB.prototype.vue";
import VariantC from "./InformationVariantC.prototype.vue";
const props = defineProps<{
  board: DeepReadonly<Board>;
  variant: string;
  selected: string | null;
  drafts: readonly string[];
  openFilters: () => void;
}>();
const pins = ref(false);
const pinned = computed(() => props.board.threads.filter((row) => row.pinned));
const rows = computed(() =>
  props.board.threads.filter((row) => !row.pinned || pins.value),
);
</script>
<template>
  <div class="prototype-board" :data-variant="variant">
    <div class="prototype-board-heading">
      <span class="prototype-board-symbol" aria-hidden="true">♫</span>
      <div>
        <span class="prototype-section-caption">交流區</span>
        <h1>{{ board.title }}</h1>
      </div>
    </div>
    <details class="prototype-board-context">
      <summary>
        About this board<span v-if="board.boards.length">
          · {{ board.boards.length }}
          {{ board.boards.length === 1 ? "sub-board" : "sub-boards" }}</span
        >
      </summary>
      <p>{{ board.statistics }}</p>
      <p>分享音樂與聆聽心得。資源分享請先閱讀置頂版規。</p>
      <a v-for="child in board.boards" :key="child.id" :href="child.url"
        ><strong>{{ child.label }}</strong
        ><span>{{ child.description }} {{ child.stats }}</span></a
      >
    </details>
    <div class="prototype-board-controls">
      <button @click="openFilters">
        <WorkspaceIcon name="filter" />Filters<span
          v-if="board.criteria.length"
        >
          · {{ board.criteria.length }}</span
        ></button
      ><button v-if="pinned.length" :aria-expanded="pins" @click="pins = !pins">
        <WorkspaceIcon name="pin" />{{ pinned.length }} pinned</button
      ><span class="prototype-muted">p. {{ board.pages.current }}</span>
    </div>
    <p v-if="pins" class="prototype-muted">Pinned threads appear first.</p>
    <p v-if="board.criteria.length" class="prototype-active-filter">
      {{ board.criteria.map((item) => item.label).join(" · ")
      }}<a v-if="board.clearFilter" :href="board.clearFilter.url">Clear</a>
    </p>
    <VariantA
      v-if="variant === 'A'"
      :rows="rows"
      :selected="selected"
      :drafts="drafts"
    />
    <VariantB
      v-else-if="variant === 'B'"
      :rows="rows"
      :selected="selected"
      :drafts="drafts"
    />
    <VariantC v-else :rows="rows" :selected="selected" :drafts="drafts" />
    <p v-if="!rows.length">{{ board.empty }}</p>
    <nav aria-label="Board pages">
      <a v-for="page in board.pages.links" :key="page.url" :href="page.url">{{
        page.label
      }}</a>
    </nav>
  </div>
</template>
