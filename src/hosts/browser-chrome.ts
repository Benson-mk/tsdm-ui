/** Temporarily own browser hints without replacing the native document's declarations. */
export function ownBrowserChrome(root: HTMLElement): () => void {
  const viewport = document.createElement("meta");
  viewport.name = "viewport";
  const theme = document.createElement("meta");
  theme.name = "theme-color";
  let originals: { node: HTMLMetaElement; position: Comment }[] = [];
  let active = false;
  const syncTheme = () => {
    if (active) theme.content = getComputedStyle(root).backgroundColor;
  };
  const acquire = () => {
    if (active || !root.isConnected) return;
    const declarations = [
      ...document.head.querySelectorAll<HTMLMetaElement>(
        'meta[name="viewport" i], meta[name="theme-color" i]',
      ),
    ];
    const nativeViewport = declarations.find(
      (node) => node.name.toLowerCase() === "viewport",
    );
    const retained = (nativeViewport?.content ?? "")
      .split(/[,;]/)
      .map((directive) => directive.trim())
      .filter(
        (directive) =>
          directive &&
          !/^(width|initial-scale|viewport-fit|user-scalable|minimum-scale|maximum-scale)\s*=/i.test(
            directive,
          ),
      );
    viewport.content = [
      ...retained,
      "width=device-width",
      "initial-scale=1",
      "viewport-fit=cover",
    ].join(", ");
    originals = declarations.map((node) => {
      const position = document.createComment("native browser declaration");
      node.replaceWith(position);
      return { node, position };
    });
    document.head.append(viewport, theme);
    active = true;
    syncTheme();
  };
  const restore = () => {
    if (!active) return;
    viewport.remove();
    theme.remove();
    for (const { node, position } of originals) position.replaceWith(node);
    originals = [];
    active = false;
  };
  const observer = new MutationObserver(syncTheme);
  observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
  window.addEventListener("pagehide", restore);
  window.addEventListener("pageshow", acquire);
  acquire();
  return () => {
    observer.disconnect();
    window.removeEventListener("pagehide", restore);
    window.removeEventListener("pageshow", acquire);
    restore();
  };
}
