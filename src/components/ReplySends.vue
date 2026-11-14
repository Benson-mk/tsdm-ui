<script setup lang="ts">
import { computed, ref } from "vue";
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "reka-ui";
import type { Workspace } from "../workspace";
import { editorText } from "./editor-strings";
import { attachmentText } from "./attachment-text";
import { description, strings } from "../layouts/strings";
const props = defineProps<{
  workspace: Workspace;
  threadId: string;
  portal: HTMLElement;
}>();
const attempts = computed(() =>
  props.workspace.writing.replyAttempts(props.threadId),
);
const text = (value: string) =>
  editorText(value, props.workspace.preferences.state.value.language);
const attachment = (value: string) =>
  attachmentText(value, props.workspace.preferences.state.value.language);
const candidates = ref<Record<string, string>>({});
const labels = computed(() =>
  strings(props.workspace.preferences.state.value.language),
);
const riskOpen = computed(
  () => props.workspace.writing.replyRisk.value?.thread === props.threadId,
);
const riskTrigger = ref<HTMLButtonElement | null>(null);
const cancel = ref<HTMLButtonElement | null>(null);
function warnRisk(id: string, event: MouseEvent) {
  riskTrigger.value = event.currentTarget as HTMLButtonElement;
  props.workspace.writing.warnReplyRisk(props.threadId, id);
}
</script>

<template>
  <section
    v-if="attempts.length"
    class="reply-sends"
    :aria-label="text('Reply submissions')"
  >
    <article
      v-for="attempt in attempts"
      :key="attempt.id"
      class="reply-send"
      :aria-label="text('Reply submission')"
    >
      <strong>{{
        text(
          attempt.status === "pending"
            ? "Sending reply"
            : attempt.status === "confirmed"
              ? "Confirmed reply"
              : attempt.status === "moderation"
                ? "Reply awaiting moderation"
                : attempt.status === "uncertain"
                  ? "Reply outcome unknown"
                  : attempt.status === "rejected"
                    ? "Reply rejected"
                    : "Reply not sent",
        )
      }}</strong>
      <p>
        {{ text("Submitted to thread") }} {{ threadId
        }}<template
          v-if="attempt.publication.submission.writing.replyTarget?.postId"
        >
          · {{ text("Post") }}
          {{
            attempt.publication.submission.writing.replyTarget.postId
          }}</template
        >
      </p>
      <label
        >{{ text("Submitted reply source")
        }}<textarea
          readonly
          :value="attempt.publication.submission.writing.source"
          rows="3"
        />
      </label>
      <p role="status">
        {{
          description(
            attempt.message,
            workspace.preferences.state.value.language,
          )
        }}
      </p>
      <a
        v-if="attempt.result"
        :href="attempt.result.url"
        @click.prevent="workspace.openThread(attempt.result.url)"
        >{{ labels.openConfirmedPost }}</a
      >
      <details v-if="attempt.replyComparison" open>
        <summary>{{ labels.replyComparison }}</summary>
        <p>{{ labels.replyComparisonLimits }}</p>
        <label v-if="attempt.replyComparison.before"
          >{{ labels.replyBeforeSource
          }}<textarea readonly :value="attempt.replyComparison.before.source" />
        </label>
        <p v-else>{{ labels.replyBeforeUnknown }}</p>
        <label
          >{{ labels.replyObservedSource
          }}<textarea
            readonly
            :value="attempt.replyComparison.observed.source"
          />
        </label>
      </details>
      <p v-if="attempt.result && !attempt.result.verification">
        {{ labels.legacyStoredConfirmation }}
      </p>
      <template v-if="attempt.result?.verification">
        <p
          v-for="normalization in attempt.result.verification.normalizations"
          :key="normalization.name"
        >
          {{ labels.normalizedStoredPrice }}
        </p>
        <p
          v-for="normalization in attempt.result.verification
            .attachmentNormalizations ?? []"
          :key="normalization.name"
        >
          {{
            labels.normalizedStoredAttachmentPrice.replace(
              "{value}",
              /^attachnew\[([1-9]\d*)\]/.exec(normalization.name)?.[1] ?? "",
            )
          }}
        </p>
        <ul v-if="attempt.result.verification.creationEffects.length">
          <li
            v-for="effect in attempt.result.verification.creationEffects"
            :key="effect.name"
          >
            {{
              attempt.publication.submission.writing.options.find(
                (option) => option.name === effect.name,
              )?.label ?? effect.name
            }}:
            {{
              effect.outcome === "unknown"
                ? labels.deliveryUnverified
                : labels.effectNotRequested
            }}
            <template v-if="effect.requested && !effect.included">
              · {{ labels.effectNotIncluded }}</template
            >
          </li>
        </ul>
      </template>
      <p v-if="attempt.status === 'pending'">
        {{
          text(
            "Sending is not confirmation. You can write the next reply while this attempt is retained.",
          )
        }}
      </p>
      <ul v-if="attempt.publication.submission.writing.uploads?.length">
        <li
          v-for="upload in attempt.publication.submission.writing.uploads"
          :key="upload.key"
        >
          {{ upload.name }}
          <button
            v-if="
              attempt.status === 'confirmed' &&
              attempt.result &&
              upload.originalSha256 &&
              upload.serverId
            "
            :aria-label="`${attachment('Check stored bytes')} ${upload.name}`"
            :disabled="
              !workspace.writing.checkableReplyAttachment(
                threadId,
                attempt.id,
                upload.key,
              )
            "
            @click="
              workspace.writing.checkReplyAttachment(
                threadId,
                attempt.id,
                upload.key,
              )
            "
          >
            {{ attachment("Check stored bytes") }}
          </button>
          <p
            v-if="
              workspace.writing.replyAttachmentResults.value[
                `${attempt.id}:${upload.key}`
              ]
            "
            role="status"
          >
            {{
              attachment(
                workspace.writing.replyAttachmentResults.value[
                  `${attempt.id}:${upload.key}`
                ]!,
              )
            }}
          </p>
        </li>
      </ul>
      <button
        v-if="['rejected', 'not-sent'].includes(attempt.status)"
        :disabled="!workspace.writing.retryableReply(threadId, attempt.id)"
        @click="workspace.writing.retryReply(threadId, attempt.id)"
      >
        {{ text("Retry reply") }}
      </button>
      <button
        v-if="['rejected', 'not-sent'].includes(attempt.status)"
        :disabled="!workspace.writing.editableReply(threadId, attempt.id)"
        @click="workspace.writing.editFailedReply(threadId, attempt.id)"
      >
        {{ text("Edit failed reply") }}
      </button>
      <div>
        <label
          >{{ text("Published reply URL (optional)")
          }}<input v-model="candidates[attempt.id]" type="url"
        /></label>
        <button
          :disabled="!!workspace.writing.replyAction.value"
          @click="
            workspace.writing.checkReplyStatus(
              threadId,
              attempt.id,
              candidates[attempt.id],
            )
          "
        >
          {{ text("Check reply status") }}
        </button>
      </div>
      <button
        v-if="attempt.status === 'uncertain' && attempt.checked"
        :disabled="
          !workspace.writing.retryableReply(threadId, attempt.id, true)
        "
        @click="warnRisk(attempt.id, $event)"
      >
        {{ text("Retry with duplicate risk") }}
      </button>
      <p>
        {{ text("Original sending account") }}:
        {{ attempt.publication.submission.writing.account.name }} ({{
          attempt.publication.submission.writing.account.id
        }})
      </p>
    </article>
    <DialogRoot
      :open="riskOpen"
      @update:open="!$event && workspace.writing.cancelReplyRisk()"
    >
      <DialogPortal :to="portal">
        <DialogOverlay class="dialog-overlay" />
        <DialogContent
          class="dialog-content reply-risk-dialog"
          @keydown.esc.stop="workspace.writing.cancelReplyRisk()"
          @pointer-down-outside.prevent
          @interact-outside.prevent
          @open-auto-focus.prevent="cancel?.focus()"
          @close-auto-focus.prevent="
            riskTrigger?.focus({ preventScroll: true })
          "
        >
          <DialogTitle>{{ text("Reply duplicate risk") }}</DialogTitle>
          <DialogDescription>{{
            text(
              "The original reply may already exist or still be in flight. Retrying may publish it twice. Its Unknown outcome will remain visible, and your newer draft will be retained.",
            )
          }}</DialogDescription>
          <button @click="workspace.writing.confirmReplyRisk()">
            {{ text("Accept duplicate risk and retry reply") }}
          </button>
          <button ref="cancel" @click="workspace.writing.cancelReplyRisk()">
            {{ text("Cancel") }}
          </button>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </section>
</template>
