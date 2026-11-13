// Throwaway, localhost-only scratch history. Not a production storage contract.
export const prefix = "tsdm.prototype.composer.v1:";
export type Target = {
  id: string;
  author: string;
  floor: number;
  text: string;
};
export type Attachment = {
  id: string;
  name: string;
  kind: "photo" | "file";
  owner: string;
  available: boolean;
};
export type Draft = {
  source: string;
  target: Target | null;
  attachments: Attachment[];
};
export type Revision = {
  id: string;
  thread: string;
  parents: string[];
  draft: Draft;
  time: number;
};
export type Attempt = {
  id: string;
  thread: string;
  draft: Draft;
  actor: string;
  owner: string;
  status: "sending" | "sent" | "failed" | "unknown" | "superseded";
  time: number;
};
export const emptyDraft = (): Draft => ({
  source: "",
  target: null,
  attachments: [],
});
export const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value));
export function records<T>(kind: string): T[] {
  const values: T[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)!;
    if (key.startsWith(prefix + kind + ":"))
      values.push(JSON.parse(localStorage.getItem(key)!));
  }
  return values;
}
export function retain(
  kind: string,
  id: string,
  value: unknown,
  refuse = false,
) {
  if (refuse) throw new Error("Simulated storage refusal");
  const key = prefix + kind + ":" + id;
  const json = JSON.stringify(value);
  localStorage.setItem(key, json);
  if (localStorage.getItem(key) !== json)
    throw new Error("Storage readback failed");
}
export function heads(all: Revision[], thread: string) {
  const revisions = all.filter((r) => r.thread === thread);
  const parents = new Set(revisions.flatMap((r) => r.parents));
  return revisions
    .filter((r) => !parents.has(r.id))
    .sort((a, b) => a.time - b.time);
}
export function revise(
  thread: string,
  draft: Draft,
  parents: string[],
  refuse = false,
) {
  const node: Revision = {
    id: crypto.randomUUID(),
    thread,
    parents,
    draft: copy(draft),
    time: Date.now(),
  };
  retain("revision", node.id, node, refuse);
  return node;
}
