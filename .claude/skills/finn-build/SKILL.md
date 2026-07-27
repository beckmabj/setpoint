---
name: finn-build
description: Claim and implement one approved Linear issue, or repair one Finn Loop pull request with requested changes. Use for Finn Loop builder passes, approved queue work, or automated recurring build runs. One invocation performs one bounded unit and never merges.
---

# Finn Build

One invocation performs one unit: repair one eligible PR or build one approved
issue end to end.

**End an idle pass immediately.** These run on a schedule, so most passes will find
nothing to do. Check for repair work and for an eligible `agent-ready` issue first;
if there is neither, say so in one line and stop — no deep repository reading, no
branch, no further tool use. A cheap no-op is what makes a slow interval
affordable.

## Preflight

Before mutating anything:

1. Run `node scripts/preflight.mjs --builder`.
2. Require a clean worktree. Never stash, reset, overwrite, or commit unrelated
   work.
3. Detect the GitHub default branch; never assume `main`.

End the pass with the exact failure if preflight is not ready.

## Repair before new work

List open PRs labeled `loop-changes-requested`. Skip any carrying
`needs-human-review`; choose the least recently updated remaining PR. Read its
linked Linear issue and latest `Finn Loop review of COMMIT_SHA` verdict.

Fix only must-fix findings, verify, push, remove `loop-changes-requested`, and
comment with the result. If the fix crosses an `NG-N` or needs a product
decision, add `needs-human-review`, remove `loop-changes-requested`, explain the
exact conflict, and end.

## Pick and claim

Use the connected Linear MCP tools to list issues on the team configured in
`.linear-loop.json`. Filter for `agent-ready`, unassigned, not `blocked`, and no
unresolved blocked-by relation. Sort by priority and then oldest first. Choose
one issue.

Claim it before reading deeply by assigning it to the authenticated Linear user
and moving it to `In Progress`, or the team's first started state. Re-fetch it
through Linear immediately. Stop if it is blocked, assigned to another person,
or no longer `agent-ready`. Run only one builder per Linear team because
assignment is a cooperative, not atomic, lock.

## Build

Read the full issue, comments, and relations. Compare every `AC-N` with every
`NG-N`. Never guess an ambiguity.

Fetch the latest default branch and create or resume
`ISSUE-ID-short-slug`. Implement only the contract using the repository's
architecture and tests. Preserve adjacent behavior.

If blocked, use Linear to post one concrete decision question, apply `blocked`,
and unassign the issue. Leave `agent-ready` in place.

## Verify and ship

Run the relevant lint, typecheck, build, and behavior tests. Review the diff and
status; stop on unrelated work or secrets.

Push and open a PR whose body includes:

- what changed and why;
- `Closes ISSUE-ID`;
- one evidence line per `AC-N`;
- one preservation line per `NG-N`;
- `Other behavior changes: None`;
- numbered manual verification steps;
- automated checks and results;
- risk: Low, Medium, or High.

If `Other behavior changes: None` is false, stop and require the Linear contract
to be amended. Comment the PR URL on Linear and move the issue to a review state
when the team has one.

Never merge or enable auto-merge.
