import type { DeepReadonly } from "vue";
import type { Directory, DirectoryGroup } from "../forum-client";

export function sourceGroupKey(
  directory: DeepReadonly<Directory>,
  group: DeepReadonly<DirectoryGroup>,
): string {
  const origin = new URL(directory.url).origin;
  if (group.sourceId) return `${origin}:${group.sourceId}`;
  if (group.sourceURL) return group.sourceURL;
  // Legacy sources have no stable native key. Content identity survives ordering,
  // but deliberately resets when membership changes rather than guessing an ID.
  return JSON.stringify([
    origin,
    group.title,
    [...new Set(group.boards.map((board) => board.id))].sort(),
  ]);
}

export type CategoryRole =
  "community" | "anime" | "creative" | "music" | "neutral";
export interface BoardCategory {
  role: CategoryRole;
  label: string;
}
// Only exact, source-recognized names qualify. Mixed native categories remain
// neutral; neither a child board name nor position can classify its parent.
const sourceRoles = new Map<string, CategoryRole>([
  ["Community", "community"],
  ["天使·后花园", "community"],
  ["天使·後花園", "community"],
  ["Anime", "anime"],
  ["天使·动漫讨论区", "anime"],
  ["天使·動漫討論區", "anime"],
  ["Creative", "creative"],
  ["天使·美工部", "creative"],
  ["Music", "music"],
]);
export function groupCategory(
  group: DeepReadonly<DirectoryGroup>,
): BoardCategory {
  return {
    role: sourceRoles.get(group.title) ?? "neutral",
    label: group.title,
  };
}
function isAggregate(group: DeepReadonly<DirectoryGroup>): boolean {
  if (!group.sourceURL) return false;
  const url = new URL(group.sourceURL);
  return (
    url.pathname.endsWith("/home.php") &&
    url.searchParams.get("mod") === "space" &&
    url.searchParams.get("do") === "favorite" &&
    url.searchParams.get("type") === "forum"
  );
}
export function boardCategory(
  directory: DeepReadonly<Directory> | null,
  id: string | null | undefined,
): BoardCategory {
  if (!directory || !id) return { role: "neutral", label: "" };
  const groups = directory.groups.filter(
    (group) =>
      !isAggregate(group) && group.boards.some((board) => board.id === id),
  );
  const unique = new Map(
    groups.map((group) => [sourceGroupKey(directory, group), group]),
  );
  if (unique.size === 1) return groupCategory([...unique.values()][0]!);
  return {
    role: "neutral",
    label: [...new Set(groups.map((group) => group.title))].join(" / "),
  };
}
