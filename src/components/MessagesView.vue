<script setup lang="ts">
import { computed, useId, type DeepReadonly } from "vue";
import type { Messages } from "../forum-client";
import type { Preferences } from "../workspace/preferences";
import { strings, insert } from "../layouts/strings";
import { nativeDestination } from "../hosts/browser";
import DestinationLoadStatus from "./DestinationLoadStatus.vue";
const props = defineProps<{
  messages: DeepReadonly<Messages> | null;
  loading: boolean;
  pending: boolean;
  failed: boolean;
  selected?: string | null;
  language: Preferences["language"];
}>();
const text = computed(() => strings(props.language));
const emit = defineEmits<{ load: [] }>();
const listEffects = useId();
const conversationEffects = useId();
</script>
<template>
  <section
    class="overview pane messages-pane"
    data-scroll-pane="overview"
    :aria-label="text.messages"
  >
    <h1>{{ text.messages }}</h1>
    <h2>{{ text.messagesHeading }}</h2>
    <p :id="listEffects">{{ text.messagesEffects }}</p>
    <p :id="conversationEffects">{{ text.privateReadEffects }}</p>
    <DestinationLoadStatus
      :loaded="messages !== null"
      :empty="messages?.peers.length === 0"
      :pending="pending"
      :failed="failed"
      :language="language"
    />
    <button
      :aria-describedby="listEffects"
      :disabled="loading"
      @click="emit('load')"
    >
      {{ messages ? text.refreshMessages : text.loadMessages }}
    </button>
    <template v-if="messages">
      <p v-if="messages.empty">{{ messages.empty }}</p>
      <article
        v-for="peer in messages.peers"
        :id="`peer-${peer.peerId}`"
        :key="peer.id"
        :data-peer-id="peer.peerId"
        tabindex="-1"
      >
        <h3>{{ peer.name }}</h3>
        <time>{{ peer.time }}</time>
        <p>{{ peer.preview }}</p>
        <p v-if="peer.unread">{{ text.messagesUnread }}</p>
        <a
          :href="peer.url"
          :aria-current="selected === peer.peerId ? 'true' : undefined"
          :aria-describedby="conversationEffects"
          >{{ insert(text.readPrivateConversation, peer.name) }}</a
        >
        <a
          :href="nativeDestination(peer.url)"
          :aria-describedby="conversationEffects"
          >{{ insert(text.messagesPeerNative, peer.name) }}</a
        >
      </article>
      <nav v-if="messages.pages.links.length" :aria-label="text.messagesPages">
        <a
          v-for="link in messages.pages.links"
          :key="link.url"
          :href="link.url"
          :aria-describedby="listEffects"
          >{{ link.label }}</a
        >
      </nav>
    </template>
    <p>{{ text.messagesNativeHistory }}</p>
    <a
      :href="
        nativeDestination(
          messages?.url ?? 'https://www.tsdm39.com/home.php?mod=space&do=pm',
        )
      "
      >{{ text.native }}</a
    >
  </section>
</template>
