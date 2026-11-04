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
  checking: boolean;
  automatic: boolean;
  paused: boolean;
  retryMinutes: number;
  checkedAt: number | null;
  refreshFailure: DeepReadonly<ReadResult> | null;
  arrivals: number;
}>();
const emit = defineEmits<{
  load: [direction: "earlier" | "later"];
  write: [];
  refresh: [];
  arrivals: [];
  automatic: [enabled: boolean];
  scroll: [event: Event];
}>();
</script>
<template>
  <div class="conversation-heading">
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
      <label v-if="automatic || (conversation.end && !conversation.later)"
        ><input
          type="checkbox"
          :checked="automatic"
          @change="
            emit('automatic', ($event.target as HTMLInputElement).checked)
          "
        />{{ strings(language).privateAutomaticChecks }}</label
      >
      <p>{{ strings(language).privateCheckEffects }}</p>
      <p role="status">
        {{
          checking
            ? strings(language).privateRefreshChecking
            : refreshFailure
              ? retryMinutes
                ? insert(strings(language).privateRefreshCooldown, retryMinutes)
                : strings(language).privateRefreshRetry
              : automatic
                ? paused
                  ? strings(language).refreshPaused
                  : strings(language).refreshEnabled
                : strings(language).refreshManual
        }}
      </p>
      <button :disabled="checking || loading !== null" @click="emit('refresh')">
        {{ strings(language).refreshConversation }}
      </button>
      <p v-if="refreshFailure && 'message' in refreshFailure" role="status">
        {{ description(refreshFailure.message, language) }}
      </p>
      <span v-if="checkedAt">{{
        insert(
          strings(language).lastSuccessfulCheck,
          new Date(checkedAt).toLocaleString(language),
        )
      }}</span>
      <button v-if="arrivals" @click="emit('arrivals')">
        {{ insert(strings(language).newMessages, arrivals) }}
      </button>
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
    <a :href="nativeDestination(conversation.url)">{{
      strings(language).native
    }}</a>
  </div>
  <section
    class="reading-pane pane private-reading-pane"
    data-scroll-pane="reading"
    :aria-label="
      insert(strings(language).privateConversation, conversation.peerName)
    "
    @scroll.passive="emit('scroll', $event)"
  >
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
  </section>
</template>
