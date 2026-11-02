<script setup lang="ts">
import { computed, type DeepReadonly } from "vue";
import type { Search, SearchField } from "../forum-client";
import type { Preferences } from "../workspace/preferences";
import { strings, description } from "../layouts/strings";
const props = defineProps<{
  search: DeepReadonly<Search>;
  loading: boolean;
  language: Preferences["language"];
  secondary?: boolean;
  selection?: string | null;
}>();
const text = computed(() => strings(props.language));
const fieldLabel = (field: DeepReadonly<SearchField>) =>
  field.labelFromForum === false
    ? description(field.label, props.language)
    : field.label;
const emit = defineEmits<{
  edit: [name: string, values: string[]];
  submit: [];
}>();
function edit(name: string, event: Event) {
  const target = event.target;
  if (target instanceof HTMLInputElement) emit("edit", name, [target.value]);
  if (target instanceof HTMLSelectElement)
    emit(
      "edit",
      name,
      [...target.selectedOptions].map((option) => option.value),
    );
}
function choice(name: string, value: string, multiple: boolean, event: Event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;
  emit(
    "edit",
    name,
    multiple
      ? target.checked
        ? [...(props.search.edited[name] ?? []), value]
        : (props.search.edited[name] ?? []).filter((v) => v !== value)
      : [value],
  );
}
const changed = computed(
  () =>
    props.search.effective !== null &&
    JSON.stringify(props.search.edited) !==
      JSON.stringify(props.search.submitted),
);
const effective = computed(() =>
  Object.entries(props.search.effective ?? {}).map(([name, values]) => {
    const field = props.search.form.fields.find(
      (f) => f.name === name && !f.disabled,
    );
    return `${field ? fieldLabel(field) : name}: ${values.map((v) => field?.options.find((o) => o.value === v)?.label ?? v).join(", ") || text.value.forumDefault}`;
  }),
);
</script>
<template>
  <section
    class="overview pane search-pane"
    :class="{ 'secondary-results': secondary }"
    data-scroll-pane="overview"
    :aria-label="text.searchOverviewLabel"
  >
    <h1>{{ text.search }}</h1>
    <p>{{ text.searchExplanation }}</p>
    <p>{{ text.searchEffects }}</p>
    <p v-for="restriction in search.form.restrictions" :key="restriction">
      {{ restriction }}
    </p>
    <form v-if="!secondary" @submit.prevent="emit('submit')">
      <template
        v-for="(field, index) in search.form.fields"
        :key="`${field.name}-${index}`"
      >
        <fieldset
          v-if="field.kind === 'choices'"
          :disabled="field.disabled || loading"
        >
          <legend>{{ fieldLabel(field) }}</legend>
          <label v-for="option in field.options" :key="option.value"
            ><input
              :type="field.multiple ? 'checkbox' : 'radio'"
              :name="field.name"
              :value="option.value"
              :checked="
                search.edited[field.name]?.includes(option.value) ?? false
              "
              :disabled="option.disabled"
              @change="choice(field.name, option.value, field.multiple, $event)"
            />{{ option.label }}</label
          >
        </fieldset>
        <label v-else class="search-field"
          >{{ fieldLabel(field) }}
          <input
            v-if="field.kind === 'text'"
            :value="search.edited[field.name]?.[0] ?? ''"
            :maxlength="field.maxLength ?? undefined"
            :readonly="field.readOnly"
            :disabled="field.disabled || loading"
            @input="edit(field.name, $event)"
          />
          <select
            v-else
            :aria-label="fieldLabel(field)"
            :multiple="field.multiple"
            :value="
              field.multiple
                ? search.edited[field.name]
                : search.edited[field.name]?.[0]
            "
            :disabled="field.disabled || loading"
            @change="edit(field.name, $event)"
          >
            <option
              v-for="option in field.options"
              :key="option.value"
              :value="option.value"
              :disabled="option.disabled"
            >
              {{ option.label }}
            </option>
          </select>
        </label>
      </template>
      <button type="submit" :disabled="loading">{{ text.search }}</button>
    </form>
    <p v-if="changed" role="status">{{ text.editedSearch }}</p>
    <section
      v-if="search.results"
      class="search-results"
      :aria-label="text.searchResults"
    >
      <h2>{{ text.searchResults }}</h2>
      <p>{{ search.results.summary }}</p>
      <p v-if="!search.results.rows.length">{{ text.noSearchMatches }}</p>
      <ul :aria-label="text.effectiveSearch">
        <li v-for="item in effective" :key="item">{{ item }}</li>
      </ul>
      <p>{{ text.page }} {{ search.results.pages.current }}</p>
      <div
        v-for="row in search.results.rows"
        :id="`row-${row.id}`"
        :key="row.id"
        class="thread-row"
        :data-thread-id="row.id"
      >
        <a
          class="subject"
          :href="row.url"
          :aria-current="selection === row.id ? 'true' : undefined"
          >{{ row.label }}</a
        ><span>{{ row.author.label }}</span
        ><span>{{ row.board.label }}</span
        ><time>{{ row.date }}</time
        ><span>{{ row.stats }}</span>
        <p>{{ row.snippet }}</p>
      </div>
      <nav :aria-label="text.searchPages">
        <a
          v-for="link in search.results.pages.links"
          :key="link.url"
          :href="link.url"
          >{{ link.label }}</a
        >
      </nav>
    </section>
  </section>
</template>
