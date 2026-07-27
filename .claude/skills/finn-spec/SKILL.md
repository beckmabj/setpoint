---
name: finn-spec
description: Research a repository, interview the user once about their ideas, and file every resulting build-ready Linear issue. Use for Finn Loop spec interviews, feature planning, or filling the agent queue. This skill is interactive and must never run unattended.
---

# Finn Spec

Turn a sitting with the user into a queue of Linear issues a fresh builder can
implement without side-channel context.

One session fills the queue. This is the only manual step in the loop, so it is
worth doing thoroughly: the user brings everything on their mind, and the session
ends with every separable piece of it filed. A session that files one issue and
asks the user to come back for the next has failed at its job.

## Research first

Read the relevant repository instructions and code. Identify existing patterns,
affected files, constraints, and tests. Never ask the user what the repository
can answer.

## Gather the whole batch first

Open by asking what is on their mind — plural. Take the full list before
interrogating any single item, then restate it as a numbered list and confirm
nothing is missing. Only then start resolving details.

## Interview

Ask one to four genuine product questions per round, and batch questions across
different items into the same round rather than finishing one item at a time. A
round that asks about three features costs the user one answer sitting; three
rounds about one feature each costs three.

Give concrete options and lead with a recommendation. Resolve behavior forks,
scope, permissions, empty and failure states, data migration, and compatibility.

Decide the small things yourself and state the assumption in the issue. Only ask
what would change the built result if answered differently. Never ask what the
repository can answer, and never ask a question whose answer you would accept
either way.

After each round, ask internally, per item:

> Could two different engineers ship the same observable behavior from this issue?

Continue until the answer is yes for every item. Do not guess product decisions
and do not add filler questions.

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

## Confirm and file the batch

Draft every issue, then show them together as one set — each with its title and
its acceptance criteria — and obtain approval for the batch in a single pass.
Approval of the set is approval of each issue in it; do not run a separate
confirmation round per issue.

File each approved issue with the connected Linear MCP tools on the team
configured in `.linear-loop.json`. Order the queue with `priority` so the builder
takes them in the sequence you intend, and record real dependencies with
`blockedBy` so a dependent issue cannot be claimed early.

Report every returned identifier and URL as a list. If Linear fails partway,
report exactly which issues were filed, which were not, and preserve the
unfiled drafts verbatim so nothing has to be re-interviewed.

Never apply `agent-ready`. Only a human applies it after reading the issue — that
label is the gate that starts the autonomous half of the loop.
