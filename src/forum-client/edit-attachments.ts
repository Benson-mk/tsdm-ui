import {
  attr,
  controlDisabled,
  descendants,
  text,
  type Element,
  type Node,
} from "./html.js";
/** Existing attachment controls only: no upload, replacement or deletion authority. */
export function editAttachmentControls(
  doc: Node,
  form: Element,
): Element[] | null {
  const controls = descendants(
    doc,
    (node) =>
      ["input", "select", "textarea", "button"].includes(node.tagName) &&
      /^(?:attach|delete)/.test(attr(node, "name")),
  );
  const names = new Set<string>();
  for (const node of controls) {
    const name = attr(node, "name");
    if (names.has(name) || attr(node, "form")) return null;
    names.add(name);
    const update = /^attachupdate\[[1-9]\d*\]$/.test(name);
    if (
      !update &&
      !/^attachnew\[[1-9]\d*\]\[(?:description|readperm|price)\]$/.test(name)
    )
      return null;
    if (
      update &&
      (node.tagName !== "input" ||
        attr(node, "type") !== "hidden" ||
        attr(node, "value") !== "")
    )
      return null;
    if (
      !update &&
      (node.tagName === "input"
        ? !["", "text", "hidden", "number"].includes(attr(node, "type"))
        : node.tagName !== "select" ||
          node.attrs.some((a) => a.name === "multiple"))
    )
      return null;
    let contained = false,
      anotherForm = false;
    for (
      let parent: Node | null = node.parentNode;
      parent;
      parent = "parentNode" in parent ? parent.parentNode : null
    ) {
      if (
        parent === form ||
        ["e_attachlist", "e_imgattachlist"].includes(attr(parent, "id"))
      )
        contained = true;
      if ("tagName" in parent && parent.tagName === "form" && parent !== form)
        anotherForm = true;
    }
    if (!contained || anotherForm) return null;
  }
  return controls;
}
export function editAttachmentFields(controls: Element[]) {
  return controls.map((node) => {
    const selected =
      node.tagName === "select"
        ? descendants(node, (n) => n.tagName === "option")
        : [];
    const chosen =
      selected.find((n) => n.attrs.some((a) => a.name === "selected")) ??
      selected[0];
    return {
      name: attr(node, "name"),
      value: chosen
        ? chosen.attrs.some((a) => a.name === "value")
          ? attr(chosen, "value")
          : text(chosen)
        : attr(node, "value"),
      disabled: controlDisabled(node),
    };
  });
}
