import type { ForumTransport } from "../forum-client";
export function createBrowserTransport(): ForumTransport {
  return {
    async requestFile(url) {
      const response = await fetch(url, {
        credentials: "same-origin",
        redirect: "error",
        cache: "no-store",
      });
      return {
        status: response.status,
        url: response.url,
        redirected: response.redirected,
        contentType: response.headers.get("content-type") ?? "",
        contentLength: response.headers.get("content-length"),
        contentEncoding: response.headers.get("content-encoding") ?? "",
        disposition: response.headers.get("content-disposition") ?? "",
        bytes: new Uint8Array(await response.arrayBuffer()),
      };
    },
    async request(url, request) {
      const response = await fetch(url, {
        credentials: "same-origin",
        cache: request?.fresh ? "no-store" : "default",
        ...(request?.method
          ? { method: request.method, body: request.body }
          : {}),
        redirect:
          new URL(url).searchParams.get("mod") === "redirect"
            ? "manual"
            : "follow",
        headers: {
          Accept: "application/json, text/html;q=0.9",
          ...(request?.method
            ? { "Content-Type": "application/x-www-form-urlencoded" }
            : {}),
        },
      });
      return {
        status: response.status,
        redirect:
          response.type === "opaqueredirect"
            ? "opaque"
            : response.redirected
              ? "followed"
              : "none",
        url: response.url,
        contentType: response.headers.get("content-type") ?? "",
        body: await response.text(),
      };
    },
  };
}
export function nativeDestination(destination: string): string {
  const url = new URL(destination);
  url.searchParams.set("tsdm-native", "1");
  url.searchParams.delete("tsdmapp");
  return url.href;
}

/** Keep the native document available for recovery without exposing a second UI. */
export function suspendNativeBackground(root: HTMLElement): () => void {
  const previous = new Map<
    HTMLElement,
    { inert: boolean; ariaHidden: string | null }
  >();
  const suspend = () => {
    for (const sibling of document.body.children) {
      if (
        sibling instanceof HTMLElement &&
        sibling !== root &&
        !previous.has(sibling)
      ) {
        previous.set(sibling, {
          inert: sibling.inert,
          ariaHidden: sibling.getAttribute("aria-hidden"),
        });
        sibling.inert = true;
        sibling.setAttribute("aria-hidden", "true");
      }
    }
  };
  const observer = new MutationObserver(suspend);
  suspend();
  observer.observe(document.body, { childList: true });
  return () => {
    observer.disconnect();
    for (const [element, state] of previous) {
      element.inert = state.inert;
      if (state.ariaHidden === null) element.removeAttribute("aria-hidden");
      else element.setAttribute("aria-hidden", state.ariaHidden);
    }
  };
}
