<script setup lang="ts">
import { ref } from "vue";
import {
  PopoverRoot,
  PopoverTrigger,
  PopoverPortal,
  PopoverContent,
  ToolbarButton,
} from "reka-ui";
import WorkspaceIcon from "./WorkspaceIcon.vue";
const props = defineProps<{
  label: string;
  icon: InstanceType<typeof WorkspaceIcon>["$props"]["name"];
  portal: HTMLElement;
  disabled?: boolean;
}>();
const open = defineModel<boolean>("open", { default: false });
const restoreFocus = ref(true);
const boundary = ref<HTMLElement | null>(null);
function changeOpen(value: boolean) {
  if (value && props.disabled) return;
  restoreFocus.value = true;
  open.value = value;
}
function close(restore = true) {
  restoreFocus.value = restore;
  open.value = false;
}
function escape(event: KeyboardEvent) {
  if (event.isComposing || event.keyCode === 229) event.preventDefault();
  event.stopPropagation();
}
</script>
<template>
  <PopoverRoot :open="open" @update:open="changeOpen">
    <ToolbarButton as-child :disabled="disabled"
      ><PopoverTrigger
        :disabled="disabled"
        :aria-label="label"
        :title="label"
        @mousedown.prevent
        ><WorkspaceIcon :name="icon" /></PopoverTrigger
    ></ToolbarButton>
    <PopoverPortal :to="portal">
      <div ref="boundary" class="safe-viewport-boundary" aria-hidden="true" />
      <PopoverContent
        class="reply-toolbar-popover"
        :side-offset="8"
        align="start"
        :collision-padding="12"
        :collision-boundary="boundary"
        @escape-key-down="escape"
        @close-auto-focus="
          (event) => {
            if (!restoreFocus) event.preventDefault();
          }
        "
      >
        <h3>{{ label }}</h3>
        <slot :close="close" /> </PopoverContent
    ></PopoverPortal>
  </PopoverRoot>
</template>
