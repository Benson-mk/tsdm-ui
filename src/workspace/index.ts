import { shallowRef, readonly } from "vue";
import type { ForumClient, ReadResult } from "../forum-client";
export interface WorkspaceState {
  loading: boolean;
  result: ReadResult | null;
  destination: string;
}
export function createWorkspace(client: ForumClient, destination: string) {
  const state = shallowRef<WorkspaceState>({
    loading: false,
    result: null,
    destination,
  });
  let sequence = 0;
  async function openThread(url: string) {
    const current = ++sequence;
    state.value = { loading: true, result: null, destination: url };
    const result = await client.readThread(url);
    if (current !== sequence || result.kind === "stale") return;
    state.value = { ...state.value, loading: false, result };
  }
  function updateAnchor(hash: string) {
    const destination = new URL(state.value.destination);
    destination.hash = hash;
    state.value = { ...state.value, destination: destination.href };
  }
  return {
    updateAnchor,
    state: readonly(state),
    openThread,
    refresh: () => openThread(state.value.destination),
  };
}
export type Workspace = ReturnType<typeof createWorkspace>;
