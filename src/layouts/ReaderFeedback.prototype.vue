<script setup lang="ts">
// Throwaway comments 4–7 approval MVP. Synthetic data, no forum operations.
import { computed, nextTick, ref, watch } from "vue";
import ComposerFeedback from "./ComposerFeedback.prototype.vue";
import {
  ContextMenuRoot,
  ContextMenuTrigger,
  ContextMenuPortal,
  ContextMenuContent,
  ContextMenuItem,
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
  DropdownMenuItem,
} from "reka-ui";
const props = defineProps<{ portal: HTMLElement; composerMvp?: boolean }>();
const modernComposer = ref<InstanceType<typeof ComposerFeedback>>();
const emit = defineEmits<{
  back: [];
  state: [note: string];
  drafts: [ids: string[]];
}>();
type Thread = {
  id: string;
  title: string;
  author: string;
  latestAuthor: string | null;
};
type Post = { id: string; floor: number; author: string; text: string };
type Scenario = "quiet" | "checking" | "new" | "failed";
const thread = ref<Thread | null>(null);
const page = ref(1),
  pendingPage = ref(1);
const author = ref("");
const scenario = ref<Scenario>("quiet");
const automatic = ref(false),
  unknownTotal = ref(false),
  copyFailure = ref(false),
  expanded = ref(false);
const scroller = ref<HTMLElement | null>(null);
const targeted = ref("");
const toast = ref("");
let toastTimer: ReturnType<typeof setTimeout>;
const clipboardReadback = ref("");
const copiedURL = ref("");
async function inspectClipboard() {
  try {
    const actual = await navigator.clipboard.readText();
    clipboardReadback.value =
      actual === copiedURL.value
        ? actual
        : "Clipboard changed. Copy a sample post link first.";
  } catch {
    clipboardReadback.value = "Clipboard read unavailable in this browser.";
  }
}
const copying = ref(false),
  fallbackURL = ref("");
const dialog = ref<HTMLDialogElement | null>(null),
  linkField = ref<HTMLInputElement | null>(null);
const dialogKind = ref("pages"),
  dialogPost = ref<Post | null>(null);
const composer = ref<{ post: Post; thread: Thread } | null>(null),
  writing = ref("");
const composerField = ref<HTMLTextAreaElement | null>(null);
const posts = computed<Post[]>(() =>
  thread.value
    ? Array.from({ length: expanded.value ? 11 : 9 }, (_, i) => ({
        id: String(Number(thread.value!.id) * 100 + i + 1),
        floor: i + 1,
        author:
          i % 3 === 0
            ? thread.value!.author
            : i % 3 === 1
              ? "小雨"
              : (thread.value!.latestAuthor ?? "青空"),
        text: [
          "最近重新開始整理一些生活中的小物件，也想聽聽大家的經驗。",
          "我也喜歡把用得順手的東西留久一點。分享不同的經驗，就是討論最有趣的地方。",
          "謝謝大家的分享！這些建議很實用，有時間會試試看。",
        ][i % 3]!,
      }))
    : [],
);
const filtered = computed(() =>
  posts.value.filter((p) => !author.value || p.author === author.value),
);
const total = computed(() => Math.max(1, Math.ceil(filtered.value.length / 3)));
const visible = computed(() =>
  filtered.value.slice((page.value - 1) * 3, page.value * 3),
);
const actions = ["Reply", "Show only this author's posts", "Rate", "Report"];
watch(
  [page, author, scenario, unknownTotal, expanded, automatic, copyFailure],
  () => {
    emit(
      "state",
      `Reader: page ${page.value}/${unknownTotal.value ? "?" : total.value}; ${author.value ? "author " + author.value : "all authors"}; ${scenario.value}; ${automatic.value ? "automatic" : "manual"} refresh (simulated); copy failure ${copyFailure.value ? "simulated" : "off"}.`,
    );
  },
);
function notify(message: string) {
  clearTimeout(toastTimer);
  toast.value = message;
  toastTimer = setTimeout(() => {
    toast.value = "";
  }, 5000);
}
async function open(
  value: Thread,
  latest = false,
  initialPage = 1,
  postId = "",
  withNewReplies = false,
) {
  thread.value = value;
  author.value = "";
  expanded.value = withNewReplies;
  scenario.value = "quiet";
  page.value = latest
    ? total.value
    : Math.max(1, Math.min(total.value, initialPage));
  targeted.value = postId || (latest ? posts.value.at(-1)!.id : "");
  dialog.value?.close();
  await nextTick();
  scroller.value!.scrollTop = 0;
  if (targeted.value)
    scroller
      .value!.querySelector(`#pid${targeted.value}`)
      ?.scrollIntoView({ block: "start" });
}
async function changeScenario(value: Scenario) {
  const box = scroller.value;
  const wasScrolled = !!box?.scrollTop;
  const anchor =
    box &&
    [...box.querySelectorAll<HTMLElement>("article")].find(
      (p) => p.getBoundingClientRect().bottom > box.getBoundingClientRect().top,
    );
  const top = anchor?.getBoundingClientRect().top;
  scenario.value = value;
  await nextTick();
  if (box && anchor && wasScrolled && top !== undefined)
    box.scrollTop += anchor.getBoundingClientRect().top - top;
}
async function revealReplies() {
  expanded.value = true;
  author.value = "";
  page.value = total.value;
  targeted.value = posts.value[9]!.id;
  scenario.value = "quiet";
  await nextTick();
  scroller.value!.scrollTop = 0;
}
async function showDialog(kind: string, post?: Post) {
  dialogKind.value = kind;
  dialogPost.value = post ?? null;
  pendingPage.value = page.value;
  await nextTick();
  dialog.value?.showModal();
  if (kind === "copy") linkField.value?.select();
}
async function confirmPage() {
  page.value = Number(pendingPage.value);
  targeted.value = "";
  dialog.value?.close();
  await nextTick();
  scroller.value!.scrollTop = 0;
}
async function filterAuthor(value: string) {
  author.value = value;
  page.value = 1;
  targeted.value = "";
  await nextTick();
  scroller.value!.scrollTop = 0;
}
async function reply(post: Post) {
  if (props.composerMvp) {
    modernComposer.value?.address(post);
    return;
  }
  if (composer.value && writing.value && composer.value.post.id !== post.id) {
    notify(
      "Your reply is still open. Discard it before replying to another post.",
    );
  } else {
    composer.value = { post, thread: thread.value! };
  }
  await nextTick();
  composerField.value?.focus();
}
let pendingAction: { name: string; post: Post } | null = null;
function action(name: string, post: Post) {
  pendingAction = { name, post };
}
function closePostMenu(event: Event) {
  if (!pendingAction) return;
  event.preventDefault();
  const { name, post } = pendingAction;
  pendingAction = null;
  if (name === "Reply") void reply(post);
  else if (name === actions[1]) void filterAuthor(post.author);
  else void showDialog(name, post);
}
function doubleClick(event: MouseEvent, post: Post) {
  if (
    (event.target as Element).closest(
      ".rf-post-text, header, button, a, input, textarea",
    )
  )
    return;
  void reply(post);
}
function nativeContext(event: MouseEvent) {
  if (
    (event.target as Element).closest("a, button, input, textarea") ||
    window.getSelection()?.toString()
  )
    event.stopPropagation();
}
function permalink(post: Post) {
  const url = new URL(location.href);
  url.search = "";
  url.searchParams.set("unit", "reader");
  url.searchParams.set("thread", thread.value!.id);
  url.searchParams.set("page", String(Math.ceil(post.floor / 3)));
  if (post.floor > 9) url.searchParams.set("replies", "11");
  url.hash = `pid${post.id}`;
  return url.href;
}
async function copyPost(post: Post) {
  const url = permalink(post);
  copying.value = true;
  toast.value = "";
  try {
    if (copyFailure.value) throw new Error("Simulated copy failure");
    await navigator.clipboard.writeText(url);
    copiedURL.value = url;
    notify(`Link to post #${post.floor} copied`);
  } catch {
    fallbackURL.value = url;
    await showDialog("copy", post);
  } finally {
    copying.value = false;
  }
}
defineExpose({
  open,
  composerScenarios: () => modernComposer.value?.scenarios(),
  canNavigate: () =>
    !props.composerMvp || modernComposer.value?.canNavigate() !== false,
});
</script>

<template>
  <div v-if="thread" class="rf-reader">
    <header class="rf-header">
      <div class="rf-heading-top">
        <span class="category-label" data-category="community">若闲小阁</span
        ><button id="close-reader" @click="emit('back')">
          Back to threads
        </button>
      </div>
      <h2>{{ thread.title }}</h2>
      <div class="rf-toolbar">
        <button class="rf-page" @click="showDialog('pages')">
          Page {{ page }} / {{ unknownTotal ? "?" : total }}
        </button>
        <span v-if="author" class="rf-filter"
          >Only {{ author }}
          <button aria-label="Show all authors" @click="filterAuthor('')">
            ×
          </button></span
        >
        <DropdownMenuRoot :modal="false"
          ><DropdownMenuTrigger
            class="rf-thread-options"
            aria-label="Thread options"
            >⋯</DropdownMenuTrigger
          ><DropdownMenuPortal :to="props.portal"
            ><DropdownMenuContent
              class="rf-menu"
              :side-offset="6"
              align="end"
              :collision-padding="12"
            >
              <DropdownMenuItem
                class="rf-menu-item"
                @select="changeScenario('checking')"
                >Check for new replies</DropdownMenuItem
              >
              <DropdownMenuItem
                class="rf-menu-item"
                @select="automatic = !automatic"
                >{{
                  automatic
                    ? "Turn off automatic checks"
                    : "Turn on automatic checks"
                }}</DropdownMenuItem
              >
              <p class="rf-menu-note">
                {{ automatic ? "Automatic checks on" : "Manual refresh" }} ·
                Preview only
              </p>
            </DropdownMenuContent></DropdownMenuPortal
          ></DropdownMenuRoot
        >
      </div>
    </header>
    <div v-if="scenario !== 'quiet'" class="rf-status" role="status">
      <template v-if="scenario === 'checking'"
        ><span>Checking for new replies…</span
        ><button @click="changeScenario('quiet')">Cancel</button></template
      >
      <template v-else-if="scenario === 'new'"
        ><span>2 new replies</span
        ><button @click="revealReplies">Show replies</button></template
      >
      <template v-else
        ><span>Couldn't check for replies.</span
        ><button @click="changeScenario('checking')">Retry</button></template
      >
    </div>
    <div ref="scroller" class="rf-scroll" tabindex="-1">
      <ContextMenuRoot v-for="post in visible" :key="post.id" :modal="false">
        <ContextMenuTrigger as-child>
          <article
            :id="`pid${post.id}`"
            class="rf-post"
            :data-targeted="targeted === post.id"
            :aria-label="`Post ${post.floor} by ${post.author}`"
            @dblclick="doubleClick($event, post)"
            @contextmenu.capture="nativeContext"
          >
            <header>
              <div class="rf-author">
                <strong>{{ post.author }}</strong
                ><small
                  >{{ post.floor === 1 ? "Thread author · " : ""
                  }}{{ post.floor }}
                  {{ post.floor === 1 ? "hour" : "hours" }} ago</small
                >
              </div>
              <div class="rf-post-controls">
                <button
                  class="rf-number"
                  :aria-label="`Copy link to post ${post.floor}`"
                  :disabled="copying"
                  title="Copy post link"
                  @click="copyPost(post)"
                >
                  #{{ post.floor }}
                </button>
                <DropdownMenuRoot :modal="false"
                  ><DropdownMenuTrigger
                    :aria-label="`Post ${post.floor} actions`"
                    >⋯</DropdownMenuTrigger
                  ><DropdownMenuPortal :to="props.portal"
                    ><DropdownMenuContent
                      class="rf-menu"
                      :side-offset="6"
                      align="end"
                      :collision-padding="12"
                      @close-auto-focus="closePostMenu"
                    >
                      <DropdownMenuItem
                        v-for="item in actions"
                        :key="item"
                        class="rf-menu-item"
                        @select="action(item, post)"
                        >{{ item }}</DropdownMenuItem
                      >
                    </DropdownMenuContent></DropdownMenuPortal
                  ></DropdownMenuRoot
                >
              </div>
            </header>
            <div class="rf-post-text">
              <p>{{ post.text }}</p>
              <p>有沒有你一直保留、偶爾拿出來還是很喜歡的東西？</p>
              <p v-if="post.floor === 1" class="rf-sample-link">
                <a
                  href="#sample-reference"
                  @click.prevent="
                    notify('Sample reference link — no external navigation.')
                  "
                  >Sample reference</a
                >
                · Text selection and links keep their usual gestures.
              </p>
            </div>
            <div class="rf-reply-space" aria-hidden="true"></div>
          </article>
        </ContextMenuTrigger>
        <ContextMenuPortal :to="props.portal"
          ><ContextMenuContent
            class="rf-menu"
            :collision-padding="12"
            @close-auto-focus="closePostMenu"
          >
            <ContextMenuItem
              v-for="item in actions"
              :key="item"
              class="rf-menu-item"
              @select="action(item, post)"
              >{{ item }}</ContextMenuItem
            >
          </ContextMenuContent></ContextMenuPortal
        >
      </ContextMenuRoot>
      <p class="rf-end">
        Page {{ page }} / {{ unknownTotal ? "?" : total
        }}<template v-if="!unknownTotal && page === total">
          · End of thread</template
        >
      </p>
    </div>
    <ComposerFeedback
      v-if="props.composerMvp"
      ref="modernComposer"
      :thread="thread"
      :scroller="scroller"
      @drafts="emit('drafts', $event)"
    />
    <section
      v-if="composer && !props.composerMvp"
      class="rf-composer"
      aria-label="Local reply preview"
    >
      <div>
        <strong
          >Reply to {{ composer.post.author }} · #{{
            composer.post.floor
          }}</strong
        ><button
          @click="
            composer = null;
            writing = '';
          "
        >
          Discard reply
        </button>
      </div>
      <p>{{ composer.thread.title }} · Preview only, cannot send</p>
      <textarea
        ref="composerField"
        v-model="writing"
        aria-label="Reply text"
        rows="2"
        placeholder="Write a sample reply…"
      ></textarea>
    </section>
    <details v-if="!props.composerMvp" class="rf-demo">
      <summary>Preview scenarios · Comments 4–7</summary>
      <div>
        <label
          >Status
          <select
            :value="scenario"
            aria-label="Simulated reply status"
            @change="
              changeScenario(
                ($event.target as HTMLSelectElement).value as Scenario,
              )
            "
          >
            <option value="quiet">Quiet</option>
            <option value="checking">Checking</option>
            <option value="new">New replies</option>
            <option value="failed">Check failed</option>
          </select></label
        >
        <label
          ><input v-model="unknownTotal" type="checkbox" />Unknown page
          total</label
        ><label
          ><input v-model="copyFailure" type="checkbox" />Simulate copy
          failure</label
        >
        <button :disabled="!copiedURL" @click="inspectClipboard">
          Check copied sample link
        </button>
        <output v-if="clipboardReadback" class="rf-clipboard-check">{{
          clipboardReadback
        }}</output>
        <p>
          Fictional posts. Copied links reopen this local preview. Double-click
          empty post space to reply; right-click or use ⋯ for all post actions.
          Checks are simulated, not timed.
        </p>
      </div>
    </details>
    <div class="rf-toast" role="status" aria-live="polite">
      <span v-if="toast">{{ toast }}</span>
    </div>
    <dialog ref="dialog" class="rf-dialog" :aria-labelledby="'rf-dialog-title'">
      <template v-if="dialogKind === 'pages'">
        <h2 id="rf-dialog-title">Go to page</h2>
        <p>Page {{ page }} / {{ unknownTotal ? "?" : total }}</p>
        <p v-if="unknownTotal">
          Total unavailable. These sample page links are available.
        </p>
        <form @submit.prevent="confirmPage">
          <label
            >Page
            <select v-model="pendingPage" aria-label="Choose page">
              <option v-for="n in total" :key="n" :value="n">{{ n }}</option>
            </select></label
          >
          <div class="rf-dialog-buttons">
            <button type="button" @click="dialog?.close()">Cancel</button
            ><button type="submit" class="rf-primary">Go</button>
          </div>
        </form>
      </template>
      <template v-else-if="dialogKind === 'copy'">
        <h2 id="rf-dialog-title">Copy post link</h2>
        <p>
          {{
            copyFailure
              ? "Simulated clipboard failure."
              : "Clipboard unavailable."
          }}
          Select and copy this link.
        </p>
        <input
          ref="linkField"
          :value="fallbackURL"
          readonly
          aria-label="Post link"
          @focus="linkField?.select()"
        /><button @click="dialog?.close()">Close</button>
      </template>
      <template v-else>
        <h2 id="rf-dialog-title">
          {{ dialogKind }} post #{{ dialogPost?.floor }}
        </h2>
        <p>By {{ dialogPost?.author }} in {{ thread.title }}</p>
        <p>
          Menu placement preview only. The forum's
          {{ dialogKind.toLowerCase() }} form would open here after checking
          availability.
        </p>
        <p>No {{ dialogKind.toLowerCase() }} is submitted in this preview.</p>
        <button @click="dialog?.close()">Close</button>
      </template>
    </dialog>
  </div>
</template>
