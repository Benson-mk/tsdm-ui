import { useState, useSyncExternalStore } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import type { Harness } from "../shared/harness";
import { EditorSurface } from "./EditorSurface";

export function App({
  harness,
  portal,
}: {
  harness: Harness;
  portal: HTMLElement;
}) {
  const state = useSyncExternalStore(harness.subscribe, harness.getSnapshot);
  const [overview, setOverview] = useState(false);
  const [dark, setDark] = useState(false);
  const [attached, setAttached] = useState(true);
  const [stockDialog, setStockDialog] = useState(
    new URLSearchParams(location.search).has("stockDialog"),
  );
  function containShadowTab(event: React.KeyboardEvent<HTMLDivElement>) {
    if (
      stockDialog ||
      event.key !== "Tab" ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey
    )
      return;
    // This fixture has three ordinary focusable controls. A local correction for
    // Radix's document.activeElement lookup, not a general focus-trap library.
    const controls = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        "input:not([disabled]), button:not([disabled])",
      ),
    );
    const active = event.nativeEvent.composedPath()[0];
    if (!event.shiftKey && active === controls.at(-1)) {
      event.preventDefault();
      controls[0]?.focus();
    }
    if (event.shiftKey && active === controls[0]) {
      event.preventDefault();
      controls.at(-1)?.focus();
    }
  }
  return (
    <div className={`app${dark ? " dark" : ""}`}>
      <header className="masthead">
        <div>
          <span className="eyebrow">THROWAWAY COMPARISON / 02</span>
          <h1>React workspace</h1>
          <p>The same writing context, hosted by React.</p>
        </div>
        <nav aria-label="Framework comparison">
          <a href="/?framework=vue" target="_blank">
            Open Vue ↗
          </a>
          <a className="chosen" href="/?framework=react" aria-current="page">
            React
          </a>
        </nav>
      </header>
      <div className="intro">
        <strong>Try the integration.</strong> Edit, switch modes, leave the
        reader, then return. Both versions share the same editor and synthetic
        source. Each page starts fresh.
      </div>
      <div className="workspace">
        <aside className="rail">
          <span className="brand">T</span>
          <button onClick={() => setOverview(true)} aria-pressed={overview}>
            Boards overview
          </button>
          <button onClick={() => setOverview(false)} aria-pressed={!overview}>
            Return to writing
          </button>
          <div className="rail-foot">
            Synthetic board
            <br />
            Thread 101 · Post 1
          </div>
        </aside>
        <main>
          {overview && (
            <section className="overview">
              <span className="eyebrow">BOARDS</span>
              <h2>A place to pause</h2>
              <p>
                Your writing is still held in this page. The editor view stays
                mounted while you explore.
              </p>
              <button onClick={() => setOverview(false)}>
                Open the example thread
              </button>
            </section>
          )}
          <div hidden={overview}>
            <section className="reader">
              <div className="breadcrumb">
                Example board / Framework workshop
              </div>
              <h2>One small interaction, two implementations</h2>
              <p>
                Use the composer below to explore source preservation, tables,
                keyboard focus and returning to your writing. This does not
                contact the forum.
              </p>
              <div className="post-meta">
                Sample member · synthetic post · #1
              </div>
            </section>
            <section className="composer">
              <div className="composer-heading">
                <div>
                  <span className="eyebrow">WRITING CONTEXT</span>
                  <h3>A reply to the example thread</h3>
                </div>
                <span className="badge">
                  {state.dirty ? "Changed locally" : "Original sample"}
                </span>
              </div>
              <div className="toolbar">
                <button
                  onClick={() => harness.session.setMode("visual")}
                  aria-pressed={state.mode === "visual"}
                  disabled={state.composing}
                >
                  Visual editor
                </button>
                <button
                  onClick={() => harness.session.setMode("source")}
                  aria-pressed={state.mode === "source"}
                  disabled={state.composing}
                >
                  BBCode source
                </button>
                <button
                  onClick={() => harness.session.undo()}
                  disabled={!state.canUndo || state.composing}
                >
                  Undo
                </button>
                <button
                  onClick={() => harness.session.redo()}
                  disabled={!state.canRedo || state.composing}
                >
                  Redo
                </button>
                <button
                  onClick={() => harness.tableAction("mergeCells")}
                  disabled={state.mode !== "visual"}
                >
                  Merge first row
                </button>
                <button
                  onClick={() => harness.tableAction("splitCell")}
                  disabled={state.mode !== "visual"}
                >
                  Split first cell
                </button>
              </div>
              {attached ? (
                <>
                  <div hidden={state.mode !== "visual"}>
                    <EditorSurface harness={harness} />
                  </div>
                  <textarea
                    hidden={state.mode !== "source"}
                    aria-label="BBCode source"
                    value={state.source}
                    onChange={(event) =>
                      harness.session.replaceSource(event.target.value)
                    }
                    onCompositionStart={() =>
                      harness.session.setComposing(true)
                    }
                    onCompositionEnd={() => harness.session.setComposing(false)}
                    spellCheck={false}
                  />
                </>
              ) : (
                <p className="detached">
                  The view is detached. Its writing context and undo history
                  remain in memory.
                </p>
              )}
              <p className="status" role="status">
                {state.message ||
                  "Unknown markup and attachment references remain visible as protected text."}
              </p>
              <div className="composer-bottom">
                <span>Local sample only · no Send action</span>
                <Dialog.Root>
                  <Dialog.Trigger>Writing options</Dialog.Trigger>
                  <Dialog.Portal container={portal}>
                    <Dialog.Overlay className="modal-overlay" />
                    <Dialog.Content
                      className="modal-content"
                      onKeyDown={containShadowTab}
                    >
                      <Dialog.Title className="dialog-title">
                        Writing options
                      </Dialog.Title>
                      <Dialog.Description className="dialog-description">
                        A real Radix dialog inside the same style host. Tab
                        between controls, then press Escape.
                      </Dialog.Description>
                      <label className="check">
                        <input type="checkbox" defaultChecked /> Include
                        signature in this example
                      </label>
                      <label className="check">
                        <input type="checkbox" /> Preview formatting hints
                      </label>
                      <Dialog.Close className="primary">Done</Dialog.Close>
                    </Dialog.Content>
                  </Dialog.Portal>
                </Dialog.Root>
              </div>
            </section>
          </div>
          <section className="lab">
            <div className="lab-heading">
              <h3>What to try</h3>
              <div>
                <button onClick={() => setDark(!dark)}>
                  Toggle appearance
                </button>
                <button onClick={() => setAttached(!attached)}>
                  {attached ? "Detach editor view" : "Attach editor view"}
                </button>
              </div>
            </div>
            <ol>
              <li>
                Switch source → visual → source without editing; compare the
                source below.
              </li>
              <li>
                Type a sentence, open Boards overview, then Return to writing
                and Undo.
              </li>
              <li>
                Merge and split the first table row. Open Writing options and
                test Tab / Escape.
              </li>
              <li>
                Try your Chinese input method manually. Automated text entry is
                not an IME check.
              </li>
            </ol>
            <label className="check">
              <input
                type="checkbox"
                checked={stockDialog}
                onChange={(event) => setStockDialog(event.target.checked)}
              />{" "}
              Use stock Radix focus behavior (reproduces the observed Tab
              escape)
            </label>
            <p className="integration-note">
              Default: a small ShadowRoot-aware Tab handler is active. This is a
              component/host integration difference, not a React limitation.
            </p>
            <dl className="metrics">
              <div>
                <dt>Active editor views</dt>
                <dd data-testid="active-views">{state.activeViews}</dd>
              </div>
              <div>
                <dt>Mounts / cleanups</dt>
                <dd>
                  {state.mounts} / {state.cleanups}
                </dd>
              </div>
              <div>
                <dt>Revision</dt>
                <dd>{state.revision}</dd>
              </div>
              <div>
                <dt>Composition</dt>
                <dd>{state.composing ? "In progress" : "Idle"}</dd>
              </div>
            </dl>
            <details open>
              <summary>Complete source readback</summary>
              <pre data-testid="source-readback">{state.source}</pre>
            </details>
          </section>
        </main>
      </div>
      <footer>
        React function components + Strict Mode · Radix dialog · shared
        ProseMirror core. Local fixture evidence only; framework choice remains
        open.
      </footer>
    </div>
  );
}
