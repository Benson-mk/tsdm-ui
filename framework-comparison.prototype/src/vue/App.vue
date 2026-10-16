<script setup lang="ts">
import { onBeforeUnmount, ref, shallowRef } from "vue";
import {
  DialogRoot,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "reka-ui";
import type { Harness } from "../shared/harness";
import EditorSurface from "./EditorSurface.vue";

const props = defineProps<{ harness: Harness; portal: HTMLElement }>();
const state = shallowRef(props.harness.getSnapshot());
const unsubscribe = props.harness.subscribe(() => {
  state.value = props.harness.getSnapshot();
});
onBeforeUnmount(unsubscribe);
const overview = ref(false),
  dark = ref(false),
  attached = ref(true);
function updateSource(event: Event) {
  props.harness.session.replaceSource(
    (event.target as HTMLTextAreaElement).value,
  );
}
</script>

<template>
  <div class="app" :class="{ dark }">
    <header class="masthead">
      <div>
        <span class="eyebrow">THROWAWAY COMPARISON / 01</span>
        <h1>Vue workspace</h1>
        <p>The same writing context, hosted by Vue 3.</p>
      </div>
      <nav aria-label="Framework comparison">
        <a class="chosen" href="/?framework=vue" aria-current="page">Vue</a
        ><a href="/?framework=react" target="_blank">Open React ↗</a>
      </nav>
    </header>
    <div class="intro">
      <strong>Try the integration.</strong> Edit, switch modes, leave the
      reader, then return. Both versions share the same editor and synthetic
      source. Each page starts fresh.
    </div>
    <div class="workspace">
      <aside class="rail">
        <span class="brand">T</span
        ><button @click="overview = true" :aria-pressed="overview">
          Boards overview</button
        ><button @click="overview = false" :aria-pressed="!overview">
          Return to writing
        </button>
        <div class="rail-foot">Synthetic board<br />Thread 101 · Post 1</div>
      </aside>
      <main>
        <section v-if="overview" class="overview">
          <span class="eyebrow">BOARDS</span>
          <h2>A place to pause</h2>
          <p>
            Your writing is still held in this page. The editor view stays
            mounted while you explore.
          </p>
          <button @click="overview = false">Open the example thread</button>
        </section>
        <div v-show="!overview">
          <section class="reader">
            <div class="breadcrumb">Example board / Framework workshop</div>
            <h2>One small interaction, two implementations</h2>
            <p>
              Use the composer below to explore source preservation, tables,
              keyboard focus and returning to your writing. This does not
              contact the forum.
            </p>
            <div class="post-meta">Sample member · synthetic post · #1</div>
          </section>
          <section class="composer">
            <div class="composer-heading">
              <div>
                <span class="eyebrow">WRITING CONTEXT</span>
                <h3>A reply to the example thread</h3>
              </div>
              <span class="badge">{{
                state.dirty ? "Changed locally" : "Original sample"
              }}</span>
            </div>
            <div class="toolbar">
              <button
                @click="harness.session.setMode('visual')"
                :aria-pressed="state.mode === 'visual'"
                :disabled="state.composing"
              >
                Visual editor
              </button>
              <button
                @click="harness.session.setMode('source')"
                :aria-pressed="state.mode === 'source'"
                :disabled="state.composing"
              >
                BBCode source
              </button>
              <button
                @click="harness.session.undo()"
                :disabled="!state.canUndo || state.composing"
              >
                Undo</button
              ><button
                @click="harness.session.redo()"
                :disabled="!state.canRedo || state.composing"
              >
                Redo
              </button>
              <button
                @click="harness.tableAction('mergeCells')"
                :disabled="state.mode !== 'visual'"
              >
                Merge first row</button
              ><button
                @click="harness.tableAction('splitCell')"
                :disabled="state.mode !== 'visual'"
              >
                Split first cell
              </button>
            </div>
            <div v-if="attached">
              <EditorSurface
                v-show="state.mode === 'visual'"
                :harness="harness"
              />
              <textarea
                v-show="state.mode === 'source'"
                aria-label="BBCode source"
                :value="state.source"
                @input="updateSource"
                @compositionstart="harness.session.setComposing(true)"
                @compositionend="harness.session.setComposing(false)"
                spellcheck="false"
              />
            </div>
            <p v-else class="detached">
              The view is detached. Its writing context and undo history remain
              in memory.
            </p>
            <p class="status" role="status">
              {{
                state.message ||
                "Unknown markup and attachment references remain visible as protected text."
              }}
            </p>
            <div class="composer-bottom">
              <span>Local sample only · no Send action</span>
              <DialogRoot
                ><DialogTrigger>Writing options</DialogTrigger
                ><DialogPortal :to="portal"
                  ><DialogOverlay class="modal-overlay" /><DialogContent
                    class="modal-content"
                    ><DialogTitle class="dialog-title"
                      >Writing options</DialogTitle
                    ><DialogDescription class="dialog-description"
                      >A real Reka dialog inside the same style host. Tab
                      between controls, then press Escape.</DialogDescription
                    ><label class="check"
                      ><input type="checkbox" checked /> Include signature in
                      this example</label
                    ><label class="check"
                      ><input type="checkbox" /> Preview formatting hints</label
                    ><DialogClose class="primary"
                      >Done</DialogClose
                    ></DialogContent
                  ></DialogPortal
                ></DialogRoot
              >
            </div>
          </section>
        </div>
        <section class="lab">
          <div class="lab-heading">
            <h3>What to try</h3>
            <div>
              <button @click="dark = !dark">Toggle appearance</button
              ><button @click="attached = !attached">
                {{ attached ? "Detach editor view" : "Attach editor view" }}
              </button>
            </div>
          </div>
          <ol>
            <li>
              Switch source → visual → source without editing; compare the
              source below.
            </li>
            <li>
              Type a sentence, open Boards overview, then Return to writing and
              Undo.
            </li>
            <li>
              Merge and split the first table row. Open Writing options and test
              Tab / Escape.
            </li>
            <li>
              Try your Chinese input method manually. Automated text entry is
              not an IME check.
            </li>
          </ol>
          <dl class="metrics">
            <div>
              <dt>Active editor views</dt>
              <dd data-testid="active-views">{{ state.activeViews }}</dd>
            </div>
            <div>
              <dt>Mounts / cleanups</dt>
              <dd>{{ state.mounts }} / {{ state.cleanups }}</dd>
            </div>
            <div>
              <dt>Revision</dt>
              <dd>{{ state.revision }}</dd>
            </div>
            <div>
              <dt>Composition</dt>
              <dd>{{ state.composing ? "In progress" : "Idle" }}</dd>
            </div>
          </dl>
          <details open>
            <summary>Complete source readback</summary>
            <pre data-testid="source-readback">{{ state.source }}</pre>
          </details>
        </section>
      </main>
    </div>
    <footer>
      Vue SFC + Composition API · Reka dialog · shared ProseMirror core. Local
      fixture evidence only; framework choice remains open.
    </footer>
  </div>
</template>
