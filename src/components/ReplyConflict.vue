<script setup lang="ts">
import { computed, ref, nextTick, type DeepReadonly } from "vue";
import { hasReplyHold, type ReplyRow } from "../workspace/reply-recovery";
import type { Preferences } from "../workspace/preferences";
import { strings, insert } from "../layouts/strings";
import { attachmentText } from "./attachment-text";
import type { WritingOption, WritingUpload } from "../forum-client";
const props = defineProps<{
  row: DeepReadonly<ReplyRow>;
  language: Preferences["language"];
  alternatives?: boolean;
  busy?: boolean;
}>();
const emit = defineEmits<{
  choose: [row: DeepReadonly<ReplyRow>, version: string];
  discard: [row: ReplyRow, version: string];
}>();
const region = ref<HTMLElement | null>(null);
const confirmation = ref<{ row: ReplyRow; version: string } | null>(null);
async function cancelDiscard() {
  const version = confirmation.value?.version;
  confirmation.value = null;
  await nextTick();
  region.value
    ?.querySelector<HTMLButtonElement>(`[data-discard-version="${version}"]`)
    ?.focus();
}
function confirmDiscard() {
  const captured = confirmation.value;
  confirmation.value = null;
  if (captured) emit("discard", captured.row, captured.version);
}
const versions = computed(() =>
  props.alternatives ? (props.row.retained ?? []) : props.row.variants,
);
const text = computed(() => strings(props.language));
function optionValue(option: DeepReadonly<WritingOption>) {
  return option.kind === "checkbox"
    ? option.checked
      ? text.value.localReplyOn
      : text.value.localReplyOff
    : option.kind === "select"
      ? (option.choices.find((choice) => choice.value === option.value)
          ?.label ?? text.value.localReplyUnavailable)
      : option.value || text.value.noReferences;
}
function fileStatus(upload: DeepReadonly<WritingUpload>) {
  return attachmentText(
    {
      selected: "Selected",
      uploading: "Uploading",
      uploaded: "Uploaded, unassociated",
      associated: "Saved association verified",
      uncertain: "Upload outcome uncertain",
      rejected: "Upload refused",
      reselect: "Unavailable",
      removed: "Server file removed",
      removing: "Removing server file",
      "removal-uncertain": "Server removal uncertain",
    }[upload.status],
    props.language,
  );
}
function attachmentDiffers(
  upload: DeepReadonly<WritingUpload>,
  version: string,
  field: "serverId" | "ownerId",
) {
  if (!upload.serverId) return false;
  return versions.value.some(
    (other) =>
      other.version !== version &&
      other.context?.uploads?.some(
        (file) =>
          file.name === upload.name &&
          file.size === upload.size &&
          file.status === upload.status &&
          (file[field] ?? null) !== (upload[field] ?? null),
      ),
  );
}
function unnamedReferences(
  context: NonNullable<DeepReadonly<ReplyRow>["variants"][number]["context"]>,
) {
  return context.uploadedReferences.filter(
    (id) =>
      !context.uploads?.some((upload) => upload.serverId === id && upload.name),
  );
}
</script>
<template>
  <section
    ref="region"
    :aria-label="
      alternatives ? text.localReplyAlternatives : text.localReplyConflict
    "
    role="region"
    class="reply-conflict"
  >
    <p v-if="!alternatives" role="alert">{{ text.localReplyPaused }}</p>
    <p>{{ text.localReplyChoiceDisclosure }}</p>
    <div
      v-for="(variant, index) in versions"
      :key="variant.version"
      class="reply-version"
    >
      <p>
        {{ text.localReplyVersion.replace("{value}", String(index + 1)) }} ·
        {{ row.threadId
        }}<template v-if="variant.context?.replyTarget?.postId">
          / #{{ variant.context.replyTarget.postId }}</template
        >
      </p>
      <textarea
        readonly
        :aria-label="
          text.localReplyVersion.replace('{value}', String(index + 1))
        "
        :value="variant.context?.source ?? text.localReplyRemoved"
        rows="4"
      />
      <button :disabled="busy" @click="emit('choose', row, variant.version)">
        {{
          variant.context
            ? text.localReplyContinue.replace("{value}", String(index + 1))
            : text.localReplyContinueEmpty
        }}
      </button>
      <button
        v-if="alternatives"
        :data-discard-version="variant.version"
        :disabled="busy || hasReplyHold(variant.context, row.sends ?? [])"
        @click="
          confirmation = {
            row: JSON.parse(JSON.stringify(row)),
            version: variant.version,
          }
        "
      >
        {{ text.localReplyDiscard.replace("{value}", String(index + 1)) }}
      </button>
      <p v-if="hasReplyHold(variant.context, row.sends ?? [])">
        {{ text.localReplyUnsettledVersion }}
      </p>
      <div v-if="variant.context" class="reply-version-context">
        <p>
          {{ variant.context.board.label }} ·
          {{ insert(text.writingThread, row.threadId) }}
        </p>
        <p v-if="variant.context.replyTarget?.postId">
          {{
            insert(
              text.addressedTo,
              variant.context.replyTarget.author,
            ).replace("{post}", variant.context.replyTarget.postId)
          }}
        </p>
        <ul
          v-if="variant.context.options.some((option) => !option.disabled)"
          :aria-label="text.localReplyOptions"
        >
          <li
            v-for="option in variant.context.options.filter(
              (option) => !option.disabled,
            )"
            :key="option.name"
          >
            {{ option.label }}: {{ optionValue(option) }}
          </li>
        </ul>
        <ul
          v-if="
            variant.context.uploads?.length ||
            unnamedReferences(variant.context).length
          "
          :aria-label="text.attachments"
        >
          <li v-for="upload in variant.context.uploads" :key="upload.key">
            {{ upload.name }} · {{ fileStatus(upload) }} · {{ upload.size }} B
            <template
              v-if="attachmentDiffers(upload, variant.version, 'serverId')"
            >
              ·
              {{
                text.localReplyAttachmentReference.replace(
                  "{value}",
                  upload.serverId!,
                )
              }}
            </template>
            <template
              v-if="attachmentDiffers(upload, variant.version, 'ownerId')"
            >
              ·
              {{
                upload.ownerId
                  ? text.localReplyUploader.replace("{value}", upload.ownerId)
                  : text.localReplyUploaderUnknown
              }}
            </template>
          </li>
          <li v-for="id in unnamedReferences(variant.context)" :key="id">
            {{ text.localReplyAttachmentReference.replace("{value}", id) }}
          </li>
        </ul>
      </div>
    </div>
    <div
      v-if="confirmation"
      role="group"
      :aria-label="text.localReplyDiscardConfirm"
    >
      <p>{{ text.localReplyDiscardWarning }}</p>
      <textarea
        readonly
        :aria-label="text.localReplyDiscardSource"
        :value="
          confirmation.row.retained?.find(
            (item) => item.version === confirmation!.version,
          )?.context?.source ?? text.localReplyRemoved
        "
        rows="4"
      />
      <button :disabled="busy" @click="confirmDiscard">
        {{ text.localReplyDiscardConfirm }}
      </button>
      <button @click="cancelDiscard">{{ text.localReplyKeep }}</button>
    </div>
  </section>
</template>
