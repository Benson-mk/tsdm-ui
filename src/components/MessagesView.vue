<script setup lang="ts">
import { computed, type DeepReadonly } from "vue";
import type { Messages } from "../forum-client";
import type { Preferences } from "../workspace/preferences";
import { strings, insert } from "../layouts/strings";
import { nativeDestination } from "../hosts/browser";
const props = defineProps<{
  messages: DeepReadonly<Messages> | null;
  loading: boolean;
  selected?: string | null;
  language: Preferences["language"];
}>();
const text = computed(() => strings(props.language));
const emit = defineEmits<{ load: [] }>();
</script>
<template>
  <section
    class="overview pane messages-pane"
    data-scroll-pane="overview"
    :aria-label="text.messages"
  >
    <h1>{{ text.messages }}</h1>
    <h2>{{ text.messagesHeading }}</h2>
    <p>{{ text.messagesEffects }}</p>
    <p>{{ text.privateReadEffects }}</p>
    <button :disabled="loading" @click="emit('load')">
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
          >{{ insert(text.readPrivateConversation, peer.name) }}</a
        >
        <a :href="nativeDestination(peer.url)">{{
          insert(text.messagesPeerNative, peer.name)
        }}</a>
      </article>
      <nav v-if="messages.pages.links.length" :aria-label="text.messagesPages">
        <a
          v-for="link in messages.pages.links"
          :key="link.url"
          :href="link.url"
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
