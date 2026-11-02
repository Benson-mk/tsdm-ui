import type { Node as PMNode } from "prosemirror-model";
export interface Range {
  from: number;
  to: number;
}
export interface Literal {
  id: string;
  status: "literal" | "ambiguous";
}
export interface LiteralRange extends Range, Literal {}
export interface PreservedRange extends Range {
  id: string;
  raw: string;
  status: "unresolved" | "ambiguous";
  reason: string;
  node: NodeJSON | null;
}
export interface NodeJSON {
  type: string;
  attrs?: Record<string, unknown>;
  content?: NodeJSON[];
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  text?: string;
}
export interface ParseOptions {
  literalRanges?: LiteralRange[];
  preservedRanges?: PreservedRange[];
}
export interface TextNode {
  type: "text";
  text: string;
  start: number;
  end: number;
  literal?: Literal | null;
}
export interface RawNode {
  type: "raw";
  raw?: string;
  start: number;
  end: number;
  reason: string;
  id: string;
  name?: string;
}
export interface TagNode {
  type: "tag";
  id: string;
  name: string;
  argument?: string;
  open: string;
  close: string;
  start: number;
  end: number;
  depth?: number;
  raw?: string;
  children: SourceNode[];
}
export interface PreservedNode {
  type: "preserved";
  record: PreservedRange;
  start: number;
  end: number;
  id: string;
}
export type SourceNode = TextNode | RawNode | TagNode | PreservedNode;
export interface RootNode {
  type: "root";
  children: SourceNode[];
  start: number;
  end: number;
}
export interface Syntax {
  id: string;
  tag: string;
  open: string;
  close: string;
  prefix: string;
  suffix: string;
}
export interface Frame extends Syntax {
  value: string;
}
export interface Issue {
  kind: string;
  reason?: string;
  id?: string;
  from?: number;
  to?: number;
  label?: string;
  message?: string;
  pmFrom?: number;
  pmTo?: number;
}
export interface Span extends Range {
  pmFrom: number;
  pmTo: number;
  kind: string;
  id: string | null;
}
export interface DocumentExport {
  source: string;
  spans: Span[];
  literalRanges: LiteralRange[];
  representationIssues: Issue[];
  preservedRanges: PreservedRange[];
}
export interface ImportedSource {
  doc: PMNode;
  issues: Issue[];
  source: string;
}
export interface SourceSelection extends Range {
  direction: "none" | "forward" | "backward";
}
export interface SourceEdit {
  value?: string;
  from?: number;
  to?: number;
  text?: string;
  selection?: Range & { direction?: string };
}
export interface SourcePatch extends Range {
  text: string;
}
