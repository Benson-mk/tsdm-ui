<script setup lang="ts">
import { computed, ref, type DeepReadonly } from "vue";
import { attachmentText } from "./attachment-text";
import PostEditor from "./PostEditor.vue";
import type { Workspace } from "../workspace";
import { strings, insert, description } from "../layouts/strings";
import type { WritingOption } from "../forum-client";
const props = defineProps<{ workspace: Workspace }>();
const state = props.workspace.writing.state;
const text = computed(() =>
  strings(props.workspace.preferences.state.value.language),
);
const attachment = (value: string) =>
  attachmentText(
    description(value, props.workspace.preferences.state.value.language),
    props.workspace.preferences.state.value.language,
  );
const unresolved = props.workspace.writing.unresolvedAttachments;
async function selectAttachments(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  input.value = "";
  if (!files.length) return;
  const selection = props.workspace.writing.beginAttachmentSelection();
  try {
    const selected = await Promise.all(
      files.map(async (f) => ({
        name: f.name,
        type: f.type,
        bytes: new Uint8Array(await f.arrayBuffer()),
      })),
    );
    selection.complete(selected);
  } catch {
    selection.fail();
  }
}

function uploadLabel(
  upload: DeepReadonly<import("../forum-client").WritingUpload>,
) {
  const c = state.value.context;
  const status =
    upload.status === "uploaded" &&
    upload.referenceKind &&
    c?.source.includes(
      `[${upload.referenceKind}]${upload.serverId}[/${upload.referenceKind}]`,
    )
      ? "Inline referenced"
      : {
          selected: "Selected",
          uploading: "Uploading",
          uploaded: "Uploaded, unassociated",
          associated: "Saved association verified",
          uncertain: "Upload outcome uncertain",
          rejected: "Upload refused",
          reselect: "Reselect file bytes",
          removed: "Server file removed",
          removing: "Removing server file",
          "removal-uncertain": "Server removal uncertain",
        }[upload.status];
  return `${attachment(status)} · ${upload.name}`;
}
const removeUpload = ref<string | null>(null);
const mentionQuery = ref("");
const currentOptions = computed(
  () =>
    state.value.context?.options.filter(
      (option) =>
        !state.value.context?.draft ||
        !["addfeed", "adddynamic", "adddynamic_doing"].includes(option.name),
    ) ?? [],
);

const resendDraftAttempt = computed(() =>
  state.value.context?.draftAttempts?.find(
    (a) => a.id === state.value.draftResend?.id,
  ),
);
function draftSummary(
  attempt: DeepReadonly<import("../forum-client").DraftAttempt>,
  revision = attempt.submission.revision,
) {
  const writing = attempt.submission.writing;
  const target = writing.draft
    ? text.value.draftAttemptTarget
        .replace("{thread}", writing.draft.threadId)
        .replace("{post}", writing.draft.postId)
    : text.value.newThread;
  return insert(
    text.value.draftAttemptDetails,
    attempt.operation === "publish"
      ? text.value.publishSavedDraft
      : text.value.saveForumDraft,
  )
    .replace("{account}", `${writing.account.name} (${writing.account.id})`)
    .replace("{board}", writing.board.id)
    .replace("{target}", target)
    .replace("{revision}", String(revision));
}
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
function attachmentLabel(name: string) {
  const match =
    /^attach(?:new|update)\[([1-9]\d*)\](?:\[(description|readperm|price)\])?$/.exec(
      name,
    );
  const labels = {
    description: text.value.attachmentDescription,
    readperm: text.value.attachmentReadPermission,
    price: text.value.attachmentPrice,
  };
  return `${text.value.attachments} ${match?.[1] ?? ""} · ${match?.[2] ? labels[match[2] as keyof typeof labels] : text.value.attachmentAssociation}`;
}

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
        state.context.action === "edit-post"
          ? insert(text.editPost, state.context.editTarget?.postId ?? "")
          : state.context.replyTarget
            ? insert(text.replyIn, state.context.replyTarget.threadId)
            : insert(
                state.context.draft ? text.draftIn : text.newThreadIn,
                state.context.board.label,
              )
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
    <p v-if="state.context.draft">
      {{ insert(text.draftIdentity, state.context.draft.threadId) }}
    </p>
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
    <button
      v-if="state.context.draftSaveAvailable"
      :disabled="state.preparing || state.publishing"
      @click="workspace.writing.saveDraft()"
    >
      {{ text.saveForumDraft }}
    </button>
    <button
      v-if="state.context.draft"
      :disabled="state.preparing || state.publishing"
      @click="workspace.writing.publishDraft()"
    >
      {{ text.publishSavedDraft }}
    </button>
    <section
      v-for="attempt in state.context.draftAttempts"
      :key="attempt.id"
      role="status"
    >
      <p>{{ draftSummary(attempt) }}</p>
      <p>
        {{
          description(
            attempt.message,
            workspace.preferences.state.value.language,
          )
        }}
      </p>
      <button
        v-if="['uncertain', 'moderation'].includes(attempt.status)"
        :aria-label="insert(text.checkOriginalDraft, attempt.id)"
        :disabled="state.publishing || state.preparing"
        @click="workspace.writing.checkDraft(attempt.id)"
      >
        {{ text.checkThreadResult }}
      </button>
      <button
        v-if="workspace.writing.canResendDraft(attempt.id)"
        :aria-label="insert(text.reviewDraftResend, attempt.id)"
        @click="workspace.writing.warnDraftResend(attempt.id)"
      >
        {{ text.prepareAnotherAttempt }}
      </button>
    </section>
    <section v-if="state.draftResend && resendDraftAttempt" role="alert">
      <p>{{ text.draftResendWarning }}</p>
      <p>{{ draftSummary(resendDraftAttempt, state.draftResend.revision) }}</p>
      <button @click="workspace.writing.cancelDraftResend()">
        {{ text.cancelDraftResend }}
      </button>
      <button
        :disabled="state.publishing || state.preparing || state.composing"
        @click="workspace.writing.confirmDraftResend()"
      >
        {{ text.confirmDraftResend }}
      </button>
    </section>
    <p
      v-if="
        !state.context.draft &&
        !state.context.attempts?.length &&
        !state.context.draftAttempts?.length
      "
    >
      {{ text.localWriting }}
    </p>
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
        <label v-if="state.context.action !== 'edit-post'"
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
      <p>
        {{
          state.context.action === "edit-post"
            ? text.editRepeatWarning
            : text.duplicatePublicationWarning
        }}
      </p>
      <button @click="workspace.writing.cancelResend()">
        {{ text.keepOriginalAttempt }}
      </button>
      <button @click="workspace.writing.confirmResend()">
        {{ text.acceptDuplicateReview }}
      </button>
    </section>
    <section v-if="state.conflict" role="alert">
      <h2>{{ text.latestServerVersion }}</h2>
      <p>{{ text.editCompare }}</p>
      <p>{{ text.writingTitle }}: {{ state.conflict.title }}</p>
      <label
        >{{ text.latestServerSource
        }}<textarea readonly :value="state.conflict.source" rows="8" />
      </label>
      <ul>
        <li
          v-for="option in [
            ...(state.conflict.category ? [state.conflict.category] : []),
            ...state.conflict.options,
          ]"
          :key="option.name"
        >
          {{ option.label }}:
          {{ option.kind === "checkbox" ? option.checked : option.value
          }}{{ option.disabled ? ` (${text.disabledOption})` : "" }}
        </li>
      </ul>
      <p>
        {{ text.attachmentReferences }}:
        {{ state.conflict.uploadedReferences.join(", ") || text.noReferences }}
      </p>
      <ul>
        <li v-for="field in state.conflict.attachmentFields" :key="field.name">
          {{ attachmentLabel(field.name) }}: {{ field.value
          }}{{ field.disabled ? ` (${text.disabledOption})` : "" }}
        </li>
      </ul>
      <button @click="workspace.writing.warnReload()">
        {{ text.reloadLatest }}
      </button>
      <p>{{ text.manualEditExplanation }}</p>
      <button @click="workspace.writing.reconcileEdit('manual')">
        {{ text.reconcileManually }}
      </button>
      <button @click="workspace.writing.warnOverwrite()">
        {{ text.saveMyVersion }}
      </button>
      <section v-if="state.reloadWarning">
        <p>{{ text.reloadEditWarning }}</p>
        <button @click="workspace.writing.cancelConflictWarning()">
          {{ text.keepLocalWriting }}</button
        ><button @click="workspace.writing.reconcileEdit('reload')">
          {{ text.discardReloadLatest }}
        </button>
      </section>
      <section v-if="state.overwriteWarning">
        <p>{{ text.overwriteEditWarning }}</p>
        <button @click="workspace.writing.cancelConflictWarning()">
          {{ text.keepLocalWriting }}</button
        ><button @click="workspace.writing.reconcileEdit('overwrite')">
          {{ text.acceptOverwriteReview }}
        </button>
      </section>
    </section>
    <div class="writing-actions">
      <button
        v-if="!state.context.draft"
        :disabled="state.preparing || state.publishing"
        @click="workspace.writing.reviewPublication()"
      >
        {{
          state.context.action === "edit-post"
            ? text.reviewEdit
            : text.reviewPublication
        }}
      </button>
      <section v-if="state.publication" role="alert">
        <p v-if="state.context.action === 'edit-post'">
          {{
            insert(text.editReview, state.publication.submission.revision)
              .replace("{post}", state.context.editTarget?.postId ?? "")
              .replace("{account}", state.context.account.name)
          }}
        </p>
        <p v-else>
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
          {{
            state.context.action === "edit-post"
              ? text.saveEditedPost
              : state.context.replyTarget
                ? text.sendReply
                : text.publishThread
          }}
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
    <section :aria-label="attachment('Attachment authoring')">
      <div v-if="removeUpload" role="alert">
        <p>
          {{
            attachment(
              "This removes the server file immediately and cannot be undone by discarding local writing. Body references are separate.",
            )
          }}
        </p>
        <button
          @click="
            workspace.writing.removeServerAttachment(removeUpload);
            removeUpload = null;
          "
        >
          {{ attachment("Confirm immediate file removal") }}
        </button>
        <button @click="removeUpload = null">
          {{ attachment("Keep server file") }}
        </button>
      </div>
      <label
        >{{ attachment("Select attachments")
        }}<input
          type="file"
          multiple
          :disabled="!state.accountVerified || state.publishing"
          @change="selectAttachments"
      /></label>
      <ul>
        <li v-for="upload in state.context.uploads ?? []" :key="upload.key">
          <p>{{ uploadLabel(upload) }}</p>
          <button
            v-if="
              upload.status === 'associated' &&
              upload.originalSha256 &&
              upload.storedPost
            "
            :aria-label="`${attachment('Check stored bytes')} ${upload.name}`"
            @click="workspace.writing.checkStoredAttachment(upload.key)"
          >
            {{ attachment("Check stored bytes") }}
          </button>
          <button
            v-if="['uploaded', 'associated'].includes(upload.status)"
            :aria-label="`${attachment('Remove server file')} ${upload.name}`"
            @click="removeUpload = upload.key"
          >
            {{ attachment("Remove server file") }}
          </button>
          <button
            v-if="upload.status === 'removal-uncertain'"
            @click="workspace.writing.removeServerAttachment(upload.key, true)"
          >
            {{ attachment("Check file removal result") }}
          </button>
          <button
            v-if="
              [
                'selected',
                'uploading',
                'rejected',
                'reselect',
                'uncertain',
                'removed',
              ].includes(upload.status)
            "
            :disabled="state.publishing"
            :aria-label="`${attachment('Remove local selection')} ${upload.name}`"
            @click="workspace.writing.removeLocalAttachment(upload.key)"
          >
            {{ attachment("Remove local selection") }}
          </button>
          <p>{{ attachment(upload.message) }}</p>
          <progress
            v-if="upload.status === 'uploading'"
            :aria-label="attachment('Attachment upload progress')"
            :value="upload.loaded"
            :max="upload.size"
          />
          <button
            v-if="upload.status === 'selected'"
            :aria-label="`${attachment('Upload')} ${upload.name}`"
            @click="workspace.writing.uploadAttachment(upload.key)"
          >
            {{ attachment("Upload") }}
          </button>
          <button
            v-if="['uploaded', 'associated'].includes(upload.status)"
            :aria-label="`${attachment('Insert')} ${upload.name}`"
            @click="workspace.writing.insertAttachment(upload.key)"
          >
            {{ attachment("Insert") }}
          </button>
        </li>
      </ul>
    </section>
    <label
      v-if="
        !state.context.replyTarget && state.context.titleAvailable !== false
      "
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
    <PostEditor :key="state.context.id" :workspace="workspace" />
    <p
      v-if="
        state.context.draft &&
        state.context.options.some((o) =>
          ['addfeed', 'adddynamic', 'adddynamic_doing'].includes(o.name),
        )
      "
    >
      {{ text.draftCreationInstructions }}
    </p>
    <fieldset>
      <legend>{{ text.currentFormOptions }}</legend>
      <label v-for="option in currentOptions" :key="option.name">
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
