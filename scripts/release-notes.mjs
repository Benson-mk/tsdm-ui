import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

// Shared by build packaging and deliberate description-only corrections.
// Authored summaries/configuration come from the working checkout; Git history
// and README links always refer to the supplied immutable release commit.
export function prepareReleaseNotes({
  tag,
  commit,
  previousTag,
  repository,
  github,
}) {
  const git = (...values) =>
    execFileSync("git", values, { encoding: "utf8" }).trim();
  if (!/^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(tag))
    throw new Error("Use vMAJOR.MINOR.PATCH");
  const summaryPath = `docs/releases/notes/${tag}.md`;
  const summary = readFileSync(summaryPath, "utf8").trim();
  if (!summary) throw new Error(`Write the version summary in ${summaryPath}`);
  const { changelog } = JSON.parse(readFileSync(".github/release.yml", "utf8"));
  const categories = changelog.categories.map((category) => ({
    ...category,
    entries: [],
  }));
  const fallback = categories.find((category) => category.labels.includes("*"));
  if (!fallback)
    throw new Error("Release categories need a catch-all '*' category");
  const excludedLabels = new Set(changelog.exclude?.labels ?? []);
  const range = previousTag ? `${previousTag}..${commit}` : commit;
  const commits = git(
    "log",
    "--no-merges",
    "--reverse",
    "--format=%H%x09%s",
    range,
  );
  const escape = (value) => value.replace(/[\\`*_{}[\]<>]/g, "\\$&");
  let changes = commits
    ? commits.split("\n").map((line) => {
        const tab = line.indexOf("\t");
        const sha = line.slice(0, tab);
        return `- ${escape(line.slice(tab + 1))} ([${sha.slice(0, 7)}](https://github.com/${repository}/commit/${sha}))`;
      })
    : ["- No non-merge commits since the previous version tag."];
  const contributorNotes = [];
  if (github) {
    // Read-only endpoints keep contents:write restricted to the approved job.
    const pages = JSON.parse(
      execFileSync(
        "gh",
        [
          "api",
          "--paginate",
          "--slurp",
          `repos/${repository}/pulls?state=closed&per_page=100`,
        ],
        { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
      ),
    );
    const reachable = new Set(git("rev-list", commit).split("\n"));
    const selected = new Set(git("rev-list", range).split("\n"));
    const merged = pages
      .flat()
      .filter((pr) => pr.merged_at && reachable.has(pr.merge_commit_sha));
    const included = merged
      .filter((pr) => selected.has(pr.merge_commit_sha))
      .sort(
        (a, b) => a.merged_at.localeCompare(b.merged_at) || a.number - b.number,
      );
    const covered = new Set();
    const visible = [];
    changes = [];
    for (const pr of included) {
      const parents = git(
        "rev-list",
        "--parents",
        "-n",
        "1",
        pr.merge_commit_sha,
      ).split(" ");
      const prCommits =
        parents.length > 2
          ? git("rev-list", `${parents[1]}..${pr.merge_commit_sha}`).split("\n")
          : [pr.merge_commit_sha];
      prCommits.forEach((sha) => covered.add(sha));
      const labels = new Set(pr.labels.map((label) => label.name));
      if ([...excludedLabels].some((label) => labels.has(label))) continue;
      visible.push(pr);
      const category = categories.find((category) =>
        category.labels.some((label) => label === "*" || labels.has(label)),
      );
      category.entries.push(
        `* ${escape(pr.title)} by @${pr.user.login} in https://github.com/${repository}/pull/${pr.number}`,
      );
    }
    const earlierAuthors = new Set(
      merged
        .filter((pr) => !selected.has(pr.merge_commit_sha))
        .map((pr) => pr.user.login),
    );
    for (const pr of visible) {
      if (!earlierAuthors.has(pr.user.login) && pr.user.type !== "Bot") {
        contributorNotes.push(
          `* @${pr.user.login} made their first merged pull request in https://github.com/${repository}/pull/${pr.number}`,
        );
        earlierAuthors.add(pr.user.login);
      }
    }
    for (const line of commits ? commits.split("\n") : []) {
      const tab = line.indexOf("\t");
      const sha = line.slice(0, tab);
      if (!covered.has(sha))
        changes.push(
          `* ${escape(line.slice(tab + 1))} in https://github.com/${repository}/commit/${sha}`,
        );
    }
  }
  fallback.entries.push(...changes);
  const sections = categories.flatMap((category) =>
    category.entries.length
      ? [`### ${category.title}`, "", ...category.entries, ""]
      : [],
  );
  const source = `https://github.com/${repository}/blob/${commit}/README.md`;
  return [
    summary,
    "",
    "## What's Changed",
    "",
    ...(sections.length
      ? sections
      : ["No included changes since the previous version tag.", ""]),
    ...(contributorNotes.length
      ? ["## New Contributors", "", ...contributorNotes, ""]
      : []),
    previousTag
      ? `**Full Changelog**: https://github.com/${repository}/compare/${previousTag}...${tag}`
      : `**Full Changelog**: https://github.com/${repository}/commits/${commit}`,
    "",
    `[Quick Start](${source}#quick-start) · [Acknowledgments](${source}#acknowledgments)`,
    "",
    "Build and synthetic checks do not establish installed browser qualification. Windows and actual Tampermonkey software-update recovery remain unverified.",
    ...(github
      ? []
      : [
          "",
          "Local preview: commit-only notes; GitHub PR attribution is added by the hosted workflow.",
        ]),
    "",
  ].join("\n");
}
