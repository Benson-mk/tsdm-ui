import { createEditorSession } from "./editor-snapshot/session.js";
import { initialSource } from "./fixture";

export class Harness {
  readonly session = createEditorSession({
    source: initialSource,
    compositionId: "synthetic-writing-1",
  });
  private listeners = new Set<() => void>();
  private mounts = 0;
  private cleanups = 0;
  private current = this.read();
  constructor() {
    this.session.subscribe(() => this.refresh());
  }
  private read() {
    return {
      ...this.session.state,
      mounts: this.mounts,
      cleanups: this.cleanups,
      activeViews: this.mounts - this.cleanups,
    };
  }
  refresh = () => {
    this.current = this.read();
    this.listeners.forEach((fn) => fn());
  };
  getSnapshot = () => this.current;
  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };
  mounted() {
    this.mounts++;
    this.refresh();
  }
  unmounted() {
    this.cleanups++;
    this.refresh();
  }
  tableAction(action: "mergeCells" | "splitCell") {
    const cells: number[] = [];
    let firstRowSeen = false;
    this.session.pmState.doc.descendants((node, pos) => {
      if (node.type.name !== "table_row") return !firstRowSeen;
      if (firstRowSeen) return false;
      firstRowSeen = true;
      node.forEach((_cell, offset) => cells.push(pos + 1 + offset));
      return false;
    });
    if (!cells.length || (action === "mergeCells" && cells.length < 2)) return;
    this.session.command("tableSelect", {
      anchor: cells[0],
      head: action === "mergeCells" ? cells[1] : cells[0],
    });
    this.session.command(action);
  }
}
export type Snapshot = ReturnType<Harness["getSnapshot"]>;
