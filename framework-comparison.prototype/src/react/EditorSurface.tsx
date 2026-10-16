import { useEffect, useRef } from "react";
import type { Harness } from "../shared/harness";
import { mountEditor } from "../shared/editor-surface";
export function EditorSurface({ harness }: { harness: Harness }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => mountEditor(host.current!, harness), [harness]);
  return <div ref={host} className="editor-mount" />;
}
