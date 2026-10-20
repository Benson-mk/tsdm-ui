export type RouteKind =
  "directory" | "board" | "thread" | "redirect" | "search" | "notices";
const keys: Record<RouteKind, readonly string[]> = {
  notices: ["mod", "do", "view", "type", "page"],
  search: [
    "mod",
    "adv",
    "searchid",
    "page",
    "orderby",
    "ascdesc",
    "searchsubmit",
    "kw",
  ],
  directory: ["mod", "gid"],
  board: [
    "mod",
    "fid",
    "page",
    "filter",
    "typeid",
    "orderby",
    "digest",
    "specialtype",
    "rewardtype",
    "dateline",
    "authorid",
  ],
  thread: [
    "mod",
    "tid",
    "page",
    "authorid",
    "ordertype",
    "viewpid",
    "from",
    "_dsign",
    "highlight",
  ],
  redirect: ["mod", "goto", "tid", "ptid", "pid", "fromuid"],
};
export function routeFor(value: string): { kind: RouteKind; url: URL } | null {
  try {
    const url = new URL(value),
      q = url.searchParams;
    if (url.protocol !== "https:" || url.username || url.password) return null;
    let kind: RouteKind | null = null;
    if (
      ["/", "/index.php", "/forum.php"].includes(url.pathname) &&
      (!q.has("mod") || q.get("mod") === "index")
    )
      kind = "directory";
    if (url.pathname === "/forum.php") {
      if (
        q.get("mod") === "forumdisplay" &&
        /^[1-9]\d*$/.test(q.get("fid") ?? "")
      )
        kind = "board";
      if (
        q.get("mod") === "viewthread" &&
        /^[1-9]\d*$/.test(q.get("tid") ?? "")
      )
        kind = "thread";
      if (
        q.get("mod") === "redirect" &&
        ((q.get("goto") === "findpost" &&
          /^[1-9]\d*$/.test(q.get("pid") ?? "")) ||
          (q.get("goto") === "lastpost" &&
            /^[1-9]\d*$/.test(q.get("tid") ?? "")))
      )
        kind = "redirect";
    }
    if (
      url.pathname === "/search.php" &&
      q.get("mod") === "forum" &&
      (!q.has("adv") || q.get("adv") === "yes") &&
      (!q.has("searchsubmit") ||
        (q.has("searchid") && q.get("searchsubmit") === "yes")) &&
      (!q.has("searchid") || /^[1-9]\d*$/.test(q.get("searchid") ?? ""))
    )
      kind = "search";
    if (
      url.pathname === "/home.php" &&
      q.get("mod") === "space" &&
      q.get("do") === "notice" &&
      ["view", "type"].every(
        (key) => !q.has(key) || /^[a-zA-Z0-9_-]+$/.test(q.get(key)!),
      )
    )
      kind = "notices";
    if (!kind) return null;
    const allowed = [...keys[kind], "extra", "mobile", "tsdmapp"];
    for (const key of q.keys())
      if (!allowed.includes(key) || q.getAll(key).length !== 1) return null;
    for (const key of [
      "gid",
      "fid",
      "tid",
      "pid",
      "ptid",
      "page",
      "authorid",
      "viewpid",
      "fromuid",
    ])
      if (q.has(key) && !/^[1-9]\d*$/.test(q.get(key) ?? "")) return null;
    if (q.has("mobile") && !["2", "no"].includes(q.get("mobile")!)) return null;
    return { kind, url };
  } catch {
    return null;
  }
}
export function threadURL(value: string): URL | null {
  const route = routeFor(value);
  return route?.kind === "thread" ? route.url : null;
}
export function cleanURL(value: string): string {
  const url = new URL(value);
  url.searchParams.delete("tsdmapp");
  return url.href;
}
