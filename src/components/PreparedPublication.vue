<script setup lang="ts">
import { computed, type DeepReadonly } from "vue";
import {
  unresolvedWritingAttachments,
  type ThreadPublication,
  type WritingOption,
} from "../forum-client";
import type { Preferences } from "../workspace/preferences";
import { strings, description } from "../layouts/strings";
import { reviewText } from "./review-text";
import { attachmentFieldLabel } from "./attachment-text";
import WritingDestination from "./WritingDestination.vue";
import InertSourcePreview from "./InertSourcePreview.vue";
const props = defineProps<{
  publication: DeepReadonly<ThreadPublication>;
  language: Preferences["language"];
}>();
const writing = computed(() => props.publication.submission.writing);
const sourceReferences = computed(() =>
  unresolvedWritingAttachments({
    source: writing.value.source,
    uploadedReferences: [],
  }),
);
const text = computed(() => strings(props.language));
const t = (value: string) => reviewText(value, props.language);
const literalBody = computed(() =>
  writing.value.options.some(
    (option) => option.name === "bbcodeoff" && option.checked,
  ),
);
function optionValue(option: DeepReadonly<WritingOption>) {
  if (option.name === "hb_password")
    return description(
      option.value ? "present (not displayed)" : "none",
      props.language,
    );
  if (option.kind === "checkbox") return t(option.checked ? "Yes" : "No");
  const choice = option.choices.find((item) => item.value === option.value);
  return choice ? `${choice.label} (${option.value})` : option.value;
}
</script>
<template>
  <section
    class="prepared-review"
    role="region"
    :aria-label="t('Prepared publication review')"
  >
    <h2>{{ t("Prepared publication review") }}</h2>
    <p>{{ t("Prepared revision") }} {{ publication.submission.revision }}</p>
    <WritingDestination :writing="writing" :language="language" review />
    <dl class="prepared-fields">
      <template v-if="!writing.replyTarget && writing.titleAvailable !== false">
        <dt>{{ text.writingTitle }}</dt>
        <dd>{{ writing.title }}</dd>
      </template>
      <template v-if="writing.category">
        <dt>{{ text.writingCategory }}</dt>
        <dd>
          {{ optionValue(writing.category)
          }}<template v-if="writing.category.disabled">
            · {{ t("disabled; not submitted") }}</template
          >
        </dd>
      </template>
    </dl>
    <h3>{{ t("Effective settings") }}</h3>
    <ul v-if="writing.options.length">
      <li v-for="option in writing.options" :key="option.name">
        {{ description(option.label, language) }}: {{ optionValue(option)
        }}<template v-if="option.disabled">
          · {{ t("disabled; not submitted") }}</template
        >
      </li>
    </ul>
    <p v-else>{{ text.noReferences }}</p>
    <h3>{{ text.attachmentReferences }}</h3>
    <p>
      {{ t("Known uploaded references") }}:
      {{ writing.uploadedReferences.join(", ") || text.noReferences }}
    </p>
    <p>
      {{ t("Source attachment references") }}:
      {{ sourceReferences.join(", ") || text.noReferences }}
    </p>
    <template v-if="writing.attachmentFields?.length">
      <h3>{{ t("Attachment fields") }}</h3>
      <ul>
        <li v-for="field in writing.attachmentFields" :key="field.name">
          {{ attachmentFieldLabel(field.name, language)
          }}<template v-if="field.value">: {{ field.value }}</template
          ><template v-if="field.disabled">
            · {{ t("disabled; not submitted") }}</template
          >
        </li>
      </ul>
    </template>
    <h3>{{ t("Body preview") }}</h3>
    <p>
      {{
        t(
          "This read-only preview does not guarantee native rendering, notification delivery or publication. Links, images and attachment references are inert. Protected or unsupported markup is retained literally; inspect the complete source.",
        )
      }}
    </p>
    <template v-if="literalBody"
      ><p>
        {{
          t(
            "BBCode is disabled in this prepared revision; the preview shows literal source.",
          )
        }}
      </p>
      <pre class="prepared-body prepared-source">{{ writing.source }}</pre>
    </template>
    <InertSourcePreview v-else :source="writing.source" :language="language" />
    <details>
      <summary>{{ t("Complete prepared source") }}</summary>
      <pre class="prepared-source" tabindex="0">{{ writing.source }}</pre>
    </details>
    <slot />
  </section>
</template>
