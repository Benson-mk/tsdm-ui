<script setup lang="ts">
import { computed, ref } from "vue";
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
  DropdownMenuItem,
} from "reka-ui";
import { strings, description } from "../layouts/strings";
import type { Workspace } from "../workspace";
import { favoriteText } from "./favorite-labels";
import WorkspaceIcon from "./WorkspaceIcon.vue";

const props = defineProps<{
  workspace: Workspace;
  portal: HTMLElement;
  boardId: string;
  boardResult?: boolean;
}>();
const language = computed(
  () => props.workspace.preferences.state.value.language,
);
const text = computed(() => strings(language.value));
const preparing = computed(() => props.workspace.writing.state.value.preparing);
const menuOpen = ref(false);
const menuTrigger = ref<InstanceType<typeof DropdownMenuTrigger> | null>(null);
const interactedOutside = ref(false);
function prepare(redPacket = false) {
  void props.workspace.writing.prepare(
    props.boardId,
    false,
    undefined,
    redPacket,
  );
}
</script>

<template>
  <div class="board-writing-actions">
    <button class="primary-action" :disabled="preparing" @click="prepare()">
      {{ text.newThread }}
    </button>
    <DropdownMenuRoot v-model:open="menuOpen" :modal="false">
      <DropdownMenuTrigger
        ref="menuTrigger"
        class="icon-button"
        :aria-label="text.boardActions"
        :title="text.boardActions"
      >
        <WorkspaceIcon name="more" />
      </DropdownMenuTrigger>
      <DropdownMenuPortal :to="portal">
        <DropdownMenuContent
          class="thread-options-menu board-actions-menu"
          :aria-label="text.boardActions"
          align="end"
          :side-offset="4"
          :collision-padding="12"
          @keydown.esc.stop="menuOpen = false"
          @interact-outside="interactedOutside = true"
          @close-auto-focus.prevent="
            () => {
              if (!interactedOutside)
                menuTrigger?.$el.focus({ preventScroll: true });
              interactedOutside = false;
            }
          "
        >
          <DropdownMenuItem
            as-child
            :disabled="preparing"
            @select="prepare(true)"
          >
            <button :disabled="preparing">
              {{ description("New red packet", language) }}
            </button>
          </DropdownMenuItem>
          <DropdownMenuItem
            v-if="boardResult"
            as-child
            :disabled="workspace.favorite.value.busy"
            @select="workspace.prepareFavorite('add', 'forum', boardId)"
          >
            <button :disabled="workspace.favorite.value.busy">
              {{ favoriteText("Save board", language) }}
            </button>
          </DropdownMenuItem>
          <DropdownMenuItem
            v-if="boardResult"
            as-child
            @select="workspace.refresh()"
          >
            <button>{{ text.refresh }}</button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenuRoot>
  </div>
</template>
