<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { Workspace } from "../workspace";
import { strings, insert, description } from "../layouts/strings";
import type { WritingOption } from "../forum-client";
const props = defineProps<{ workspace: Workspace }>();
const state = props.workspace.writing.state;
const text = computed(() =>
  strings(props.workspace.preferences.state.value.language),
);
const unresolved = props.workspace.writing.unresolvedAttachments;
const editor = ref<HTMLTextAreaElement | null>(null);
const mentionQuery = ref("");
const candidateURLs = ref<Record<string, string>>({});
function effectLabel(
  options: readonly { name: string; label: string }[],
  name: string,
): string {
  return description(
    options.find((option) => option.name === name)?.label ?? "",
    props.workspace.preferences.state.value.language,
  );
}
function selection() {
  const element = editor.value;
  if (element)
    props.workspace.writing.edit({
      selection: {
        start: element.selectionStart,
        end: element.selectionEnd,
        direction: element.selectionDirection,
      },
    });
}
function editSource(event: Event) {
  const element = event.target as HTMLTextAreaElement;
  props.workspace.writing.edit({
    source: element.value,
    selection: {
      start: element.selectionStart,
      end: element.selectionEnd,
      direction: element.selectionDirection,
    },
  });
}
onMounted(() => {
  const range = state.value.context?.selection;
  if (editor.value && range) {
    editor.value.focus();
    editor.value.setSelectionRange(range.start, range.end, range.direction);
  }
});
function value(event: Event) {
  return (event.target as HTMLInputElement).value;
}
function updateOption(option: WritingOption, event: Event) {
  const context = state.value.context;
  if (!context || option.disabled) return;
  const next = {
    ...option,
    value: value(event),
    checked: (event.target as HTMLInputElement).checked ?? option.checked,
  };
  if (option.name === "typeid")
    props.workspace.writing.edit({ category: next });
  else
    props.workspace.writing.edit({
      options: context.options.map((item) =>
        item.name === option.name
          ? next
          : { ...item, choices: [...item.choices] },
      ),
    });
}
</script>
<template>
  <section
    v-if="state.context"
    class="source-writing"
    :aria-label="text.writingContext"
    @compositionstart="workspace.writing.startComposition()"
    @compositionend="workspace.writing.endComposition()"
  >
    <p v-if="state.compositionDeferred" role="status">
      {{ text.finishComposition }}
    </p>
    <h1>
      {{
        state.context.replyTarget
          ? insert(text.replyIn, state.context.replyTarget.threadId)
          : insert(text.newThreadIn, state.context.board.label)
      }}
    </h1>
    <p v-if="state.context.replyTarget?.postId">
      {{
        insert(text.addressedTo, state.context.replyTarget.author).replace(
          "{post}",
          state.context.replyTarget.postId,
        )
      }}
    </p>
    <p v-if="state.context.replyTarget">{{ text.replyDeliveryUnknown }}</p>
    <p>
      {{ insert(text.writingAs, state.context.account.name) }} ·
      {{ insert(text.writingBoard, state.context.board.id) }}
    </p>
    <p v-if="!state.accountVerified" role="alert">
      {{ insert(text.writingPaused, state.context.account.name) }}
    </p>
    <p v-if="unresolved.length" role="alert">
      {{ insert(text.unresolvedAttachments, unresolved.join(", ")) }}
    </p>
    <div class="writing-actions">
      <button
        :disabled="state.preparing || state.publishing"
        @click="workspace.writing.check()"
      >
        {{ text.checkWriting }}
      </button>
      <button
        :disabled="state.preparing || state.publishing"
        @click="workspace.writing.check(true)"
      >
        {{ text.prepareTextCopy }}
      </button>
    </div>
    <section v-if="state.copy" role="alert">
      <p>
        {{
          insert(text.copyWritingPrompt, state.context.account.name).replace(
            "{account}",
            state.copy.prepared.account.name,
          )
        }}
      </p>
      <p>{{ text.copyWritingLimits }}</p>
      <button @click="workspace.writing.cancelCopy()">
        {{ text.keepWriting }}
      </button>
      <button
        :disabled="state.publishing"
        @click="workspace.writing.confirmCopy()"
      >
        {{ text.replaceTextCopy }}
      </button>
    </section>
    <p v-if="!state.context.attempts?.length">{{ text.localWriting }}</p>
    <section
      v-for="attempt in state.context.attempts"
      :key="attempt.id"
      role="status"
    >
      <p>
        {{
          description(
            attempt.message,
            workspace.preferences.state.value.language,
          )
        }}
      </p>
      <details v-if="attempt.replyComparison" open>
        <summary>{{ text.replyComparison }}</summary>
        <p>{{ text.replyComparisonLimits }}</p>
        <label v-if="attempt.replyComparison.before"
          >{{ text.replyBeforeSource
          }}<textarea readonly :value="attempt.replyComparison.before.source" />
        </label>
        <p v-else>{{ text.replyBeforeUnknown }}</p>
        <label
          >{{ text.replyObservedSource
          }}<textarea
            readonly
            :value="attempt.replyComparison.observed.source"
          />
        </label>
      </details>
      <template v-if="attempt.result?.verification">
        <p
          v-for="normalization in attempt.result.verification.normalizations"
          :key="normalization.name"
        >
          {{ text.normalizedStoredPrice }}
        </p>
        <ul v-if="attempt.result.verification.creationEffects.length">
          <li
            v-for="effect in attempt.result.verification.creationEffects"
            :key="effect.name"
          >
            {{
              effectLabel(
                attempt.publication.submission.writing.options,
                effect.name,
              )
            }}:
            <span>{{
              effect.outcome === "unknown"
                ? text.deliveryUnverified
                : text.effectNotRequested
            }}</span>
            <span v-if="effect.requested && !effect.included">
              · {{ text.effectNotIncluded }}</span
            >
          </li>
        </ul>
      </template>
      <p v-else-if="attempt.result">{{ text.legacyStoredConfirmation }}</p>
      <a
        v-if="attempt.result"
        :href="attempt.result.url"
        @click.prevent="workspace.openThread(attempt.result.url)"
        >{{
          attempt.publication.submission.writing.replyTarget
            ? text.openConfirmedPost
            : text.openConfirmedThread
        }}</a
      >
      <template
        v-if="attempt.status === 'uncertain' || attempt.status === 'moderation'"
      >
        <label
          >{{ text.candidateThreadURL
          }}<input
            v-model="candidateURLs[attempt.id]"
            type="url"
            :placeholder="attempt.candidateURL ?? ''"
        /></label>
        <button
          :disabled="state.publishing"
          @click="
            workspace.writing.checkResult(attempt.id, candidateURLs[attempt.id])
          "
        >
          {{ text.checkThreadResult }}
        </button>
        <button
          v-if="attempt.status === 'uncertain'"
          :disabled="!attempt.checked || state.publishing"
          @click="workspace.writing.warnResend(attempt.id)"
        >
          {{ text.prepareAnotherAttempt }}
        </button>
      </template>
    </section>
    <section v-if="state.resend" role="alert">
      <p>{{ text.duplicatePublicationWarning }}</p>
      <button @click="workspace.writing.cancelResend()">
        {{ text.keepOriginalAttempt }}
      </button>
      <button @click="workspace.writing.confirmResend()">
        {{ text.acceptDuplicateReview }}
      </button>
    </section>
    <div class="writing-actions">
      <button
        :disabled="state.preparing || state.publishing"
        @click="workspace.writing.reviewPublication()"
      >
        {{ text.reviewPublication }}
      </button>
      <section v-if="state.publication" role="alert">
        <p>
          {{
            insert(
              state.publication.submission.writing.replyTarget
                ? text.replyPublicationReview
                : text.publicationReview,
              state.publication.submission.revision,
            )
              .replace(
                "{thread}",
                state.publication.submission.writing.replyTarget?.threadId ??
                  "",
              )
              .replace("{account}", state.context.account.name)
              .replace("{board}", state.context.board.label)
          }}
        </p>
        <button
          :disabled="state.publishing"
          @click="workspace.writing.publish()"
        >
          {{ state.context.replyTarget ? text.sendReply : text.publishThread }}
        </button>
      </section>
    </div>
    <p v-if="state.recoveryAvailable === false" role="alert">
      {{ text.writingRecoveryUnavailable }}
    </p>
    <p v-else-if="state.acknowledged === state.context.revision" role="status">
      {{ insert(text.writingAcknowledged, state.acknowledged) }}
    </p>
    <p v-else role="status">
      {{
        insert(text.writingPending, state.context.revision).replace(
          "{acknowledged}",
          String(state.acknowledged),
        )
      }}
    </p>
    <section :aria-label="text.mentions">
      <label
        >{{ text.findMentionPerson }}<input v-model="mentionQuery"
      /></label>
      <button
        :disabled="state.findingMention || state.publishing"
        @click="workspace.writing.searchMention(mentionQuery)"
      >
        {{ text.findMention }}
      </button>
      <button
        v-for="person in state.mentionPeople"
        :key="person.id"
        @click="workspace.writing.insertMention(person.id)"
      >
        {{ insert(text.mentionPerson, person.name).replace("{id}", person.id) }}
      </button>
    </section>
    <label v-if="!state.context.replyTarget"
      >{{ text.writingTitle
      }}<input
        :value="state.context.title"
        @input="workspace.writing.edit({ title: value($event) })"
    /></label>
    <label v-if="state.context.category"
      >{{ text.writingCategory
      }}<select
        :aria-label="text.writingCategory"
        :value="state.context.category.value"
        :disabled="state.context.category.disabled"
        @change="updateOption(state.context.category as WritingOption, $event)"
      >
        <option
          v-for="choice in state.context.category.choices"
          :key="choice.value"
          :value="choice.value"
          :disabled="choice.disabled"
        >
          {{ choice.label }}
        </option>
      </select></label
    >
    <label
      >{{ text.completeSource
      }}<textarea
        ref="editor"
        :value="state.context.source"
        rows="14"
        spellcheck="false"
        @select="selection"
        @keyup="selection"
        @click="selection"
        @blur="selection"
        @input="editSource"
      />
    </label>
    <fieldset>
      <legend>{{ text.currentFormOptions }}</legend>
      <label v-for="option in state.context.options" :key="option.name">
        <template v-if="option.kind === 'checkbox'"
          ><input
            type="checkbox"
            :checked="option.checked"
            :value="option.value"
            :disabled="option.disabled"
            @change="updateOption(option as WritingOption, $event)"
          />{{ option.label }}</template
        >
        <template v-else
          >{{ option.label
          }}<select
            v-if="option.kind === 'select'"
            :aria-label="option.label"
            :value="option.value"
            :disabled="option.disabled"
            @change="updateOption(option as WritingOption, $event)"
          >
            <option
              v-for="choice in option.choices"
              :key="choice.value"
              :value="choice.value"
              :disabled="choice.disabled"
            >
              {{ choice.label }}
            </option></select
          ><input
            v-else
            :value="option.value"
            :disabled="option.disabled"
            :maxlength="option.maxLength ?? undefined"
            @input="updateOption(option as WritingOption, $event)"
        /></template>
      </label>
    </fieldset>
    <button @click="workspace.writing.hide()">{{ text.returnReading }}</button>
  </section>
</template>
