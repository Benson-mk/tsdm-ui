<script setup lang="ts">
import { privateWritingText } from "./private-writing-text";
import type { DeepReadonly } from "vue";
import type { PrivateConversation, ReadResult } from "../forum-client";
import ContentView from "./ContentView";
import type { Preferences } from "../workspace/preferences";
import { strings, insert, description } from "../layouts/strings";
import { nativeDestination } from "../hosts/browser";
defineProps<{
  conversation: DeepReadonly<PrivateConversation>;
  language: Preferences["language"];
  loading: "earlier" | "later" | null;
  failure: DeepReadonly<ReadResult> | null;
}>();
const emit = defineEmits<{
  load: [direction: "earlier" | "later"];
  write: [];
}>();
</script>
<template>
  <section
    class="reading-pane pane private-reading-pane"
    data-scroll-pane="reading"
    :aria-label="
      insert(strings(language).privateConversation, conversation.peerName)
    "
  >
    <section class="thread-heading">
      <p class="eyebrow">{{ strings(language).privateContext }}</p>
      <h1>
        {{
          insert(strings(language).privateConversation, conversation.peerName)
        }}
      </h1>
      <p>{{ strings(language).privateReadEffects }}</p>
    </section>
    <div class="history-controls">
      <button
        v-if="conversation.earlier"
        :disabled="loading !== null"
        @click="emit('load', 'earlier')"
      >
        {{ strings(language).loadEarlierMessages }}</button
      ><button
        v-if="conversation.later"
        :disabled="loading !== null"
        @click="emit('load', 'later')"
      >
        {{ strings(language).loadLaterMessages }}
      </button>
      <p v-if="conversation.beginning && conversation.end">
        {{ strings(language).privateHistoryComplete }}
      </p>
      <p v-else>{{ strings(language).privateHistoryUnknown }}</p>
      <p v-if="failure && 'message' in failure" role="status">
        {{ description(failure.message, language) }}
      </p>
    </div>
    <button @click="emit('write')">
      {{ privateWritingText("Write private message", language) }}
    </button>
    <p v-if="conversation.targetMissing" role="status">
      {{ strings(language).privateMissingTarget }}
    </p>
    <p v-if="conversation.empty">{{ conversation.empty }}</p>
    <article
      v-for="message in conversation.messages"
      :id="`pmlist_${message.id}`"
      :key="message.id"
      tabindex="-1"
      :data-targeted="conversation.target === message.id"
    >
      <header>
        <strong>{{ message.sender }}</strong
        ><time>{{ message.time }}</time
        ><a :href="message.url">#{{ message.id }}</a>
      </header>
      <ContentView
        :nodes="message.body"
        :language="language"
        :native-links="true"
      />
    </article>
    <a :href="nativeDestination(conversation.url)">{{
      strings(language).native
    }}</a>
  </section>
</template>
