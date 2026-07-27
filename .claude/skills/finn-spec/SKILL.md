---
name: finn-spec
description: Research a repository, interview the user about a raw product idea, and create a build-ready Linear issue. Use for Finn Loop spec interviews, feature planning, or drafting an approved agent queue item. This skill is interactive and must never run unattended.
---

# Finn Spec

Turn a raw idea into a Linear issue that a fresh builder can implement without
side-channel context.

## Research first

Read the relevant repository instructions and code. Identify existing patterns,
affected files, constraints, and tests. Never ask the user what the repository
can answer.

## Interview

Ask one to four genuine product questions per round. Give concrete options and
lead with a recommendation when useful. Resolve behavior forks, scope,
permissions, empty and failure states, data migration, and compatibility.

After each round, ask internally:

> Could two different engineers ship the same observable behavior from this issue?

Continue until the answer is yes. Do not guess product decisions and do not add
filler questions.

## Draft

Use exactly this structure:

```md
## Problem

One or two sentences.

## Acceptance Criteria

- [ ] AC-1 — Observable, testable outcome

## Non-goals

- NG-1 — Explicitly excluded behavior

## Relevant files

- path/to/file — why it matters

## Test expectations

- Behavior to test and the correct seam

## How to verify

1. Reproducible manual step covering an acceptance criterion
```

Give every criterion a stable `AC-N` ID and every non-goal a stable `NG-N` ID.
No criterion may require a non-goal. Keep each issue to one agent-day or less;
split larger work into ordered, independently buildable issues.

## Confirm and file

Show the complete draft and obtain explicit user approval. Then use the
connected Linear MCP tools to create the issue on the team configured in
`.linear-loop.json`. Report the returned Linear identifier and URL. If Linear
is unavailable, preserve the approved draft and report the exact failed
preflight item.

Never apply `agent-ready`. Only a human applies it after reading the issue.
