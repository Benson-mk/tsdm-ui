# Issue tracker: GitHub

Issues and specs for this repo live in GitHub Issues for
`Benson-mk/tsdm-ui`: https://github.com/Benson-mk/tsdm-ui/issues.

Use the `gh` CLI. Run commands inside this clone so `gh` infers the
repository from the remote; otherwise pass `--repo Benson-mk/tsdm-ui`.

## Conventions

- Create an issue:
  `gh issue create --title "..." --body-file <path>`.
- Read an issue:
  `gh issue view <number> --json number,title,body,labels,comments`.
- List issues:
  `gh issue list --state open --json number,title,body,labels`.
  Add label and state filters as needed.
- Comment on an issue:
  `gh issue comment <number> --body-file <path>`.
- Apply or remove labels:
  `gh issue edit <number> --add-label "..."` or
  `gh issue edit <number> --remove-label "..."`.
- Close an issue:
  `gh issue close <number> --comment "..."`.

For multiline issue bodies and comments, write the exact Markdown to a
file and pass it with `--body-file`.

## Parent and child issues

Use GitHub sub-issues when available. With `gh` 2.94 or later, use
`gh issue create --parent <parent> ...` or
`gh issue edit <parent> --add-sub-issue <child>`.

If sub-issues are unavailable, put `Part of #<parent>` at the top of
the child issue body and link the child from a task list in the parent.

## Pull requests as a triage surface

**PRs as a request surface: no.**

If enabled later, use the equivalent `gh pr` commands for PR triage.
GitHub shares issue and PR numbers; resolve an ambiguous number with
`gh pr view <number>` and fall back to `gh issue view <number>`.

## Skill terminology

When a skill says "publish to the issue tracker", create a GitHub issue.

When a skill says "fetch the relevant ticket", read the GitHub issue
including its body, labels, and comments.

## Wayfinding operations

Used by `wayfinder`. The map is a single issue with child issues as tickets.

- **Map:** create an issue labelled `wayfinder:map`, with the destination,
  notes, decisions so far, and remaining questions in its body.
- **Child ticket:** link an issue to the map using the parent and child
  conventions above. Use a `wayfinder:<type>` label, where the type is
  `research`, `prototype`, `grilling`, or `task`.
- **Blocking:** use GitHub's native issue dependencies. Add a dependency
  with `gh api --method POST repos/Benson-mk/tsdm-ui/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`.
  Obtain the blocker's numeric database ID with
  `gh api repos/Benson-mk/tsdm-ui/issues/<number> --jq .id`.
  Use the database ID, rather than the issue number or node ID.
  If native dependencies are unavailable, put `Blocked by: #<number>`
  at the top of the child body. A ticket is unblocked when all blockers
  are closed.
- **Frontier:** list the map's open children using its sub-issues or task
  list. Exclude assigned issues and issues with open blockers, using
  `issue_dependencies_summary.blocked_by` or the fallback body links.
  Choose the first remaining child in map order.
- **Claim:** assign the ticket to the driving developer before other work:
  `gh issue edit <number> --add-assignee @me`.
- **Resolve:** post the answer with
  `gh issue comment <number> --body-file <path>`, close the issue with
  `gh issue close <number>`, and append a brief decision with a link to
  the ticket in the map's Decisions so far section.
