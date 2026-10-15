# Domain docs

This repository uses a single-context domain documentation layout:

- `GLOSSARY.md` at the repository root.
- Architecture Decision Records (ADRs) under `docs/adr/`.

## Before exploring the codebase

Read the root `GLOSSARY.md` and the ADRs relevant to the area being explored.

If these files do not exist, proceed silently. Domain documentation is
created lazily by the `domain-modeling` skill as terms and decisions are
resolved.

## Use the glossary's vocabulary

When naming a domain concept in an issue, proposal, hypothesis, or test,
use the term defined in `GLOSSARY.md`.

If a needed concept is missing, reconsider whether it belongs to the
project's vocabulary. If it represents a real gap, note it for
`domain-modeling`.

## Surface ADR conflicts

If a proposal contradicts an existing ADR, identify the ADR and explain
why the decision should be reconsidered.
