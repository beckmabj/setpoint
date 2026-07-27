---
name: finn-review
description: Merge any pull request the human has cleared, then review one open Finn Loop pull request against its linked Linear contract and required GitHub checks and post a SHA-bound verdict and queue label. Use for Finn Loop reviewer passes or recurring review automation. Never changes code.
---

# Finn Review

Each invocation does two things in order: merge what the human has cleared, then
review one PR.

**End an idle pass immediately.** These run on a schedule, so most passes will find
nothing to do. When one `gh pr list` shows no PR to merge and none to review, say so
in one line and stop — no preflight, no Linear calls, no further tool use. A cheap
no-op is what makes a slow interval affordable.

## Merge what the human cleared

Run this before reviewing, so a cleared PR lands promptly rather than waiting a
full cycle.

List open PRs carrying **both** `loop-approved` and `merge-approved`. The human
applies `merge-approved`; it is their merge signal and the only thing that
authorizes a merge. Never apply it, never merge without it, and never merge a PR
carrying `needs-human-review` or `loop-changes-requested`.

For each such PR, re-verify at its **current** head SHA before touching it:

- a `Finn Loop review of COMMIT_SHA` comment exists for exactly that SHA and says
  `Safe to merge: Yes`;
- `mergeable` is clean and `mergeStateStatus` is not blocked;
- `gh pr checks NUMBER --required` is green.

If the head SHA moved after the human cleared it, the signal referred to code they
did not see. Do not merge: remove `merge-approved`, comment saying the branch
changed after clearance and that it needs a fresh look, and let the review path
re-run.

When every condition holds, merge with `gh pr merge NUMBER --squash --delete-branch`.
Then comment the merge commit SHA on the linked Linear issue and move it to the
team's completed state. Report each merge.

Never enable auto-merge, never merge on your own judgment, and never merge
because checks are green — only ever on the human's label.

## Preflight and select

Run `node scripts/preflight.mjs --reviewer`. List open non-draft PRs with their
labels and head SHAs. Skip a PR when its current SHA already has a comment whose
first line is `Finn Loop review of COMMIT_SHA` and it has a terminal loop label.
Review again after new commits.

## Read the contract and code

Parse `Closes ISSUE-ID` from the body and fetch that issue, comments, and
relations with the connected Linear MCP tools. Missing or malformed contract
linkage is a must-fix finding. Read the full diff and every changed file in
context.

Review acceptance-criteria gaps, defects, data flow, scope expansion, security,
missing loading/error states, and maintainability. Keep findings inside the
Linear contract. Prefix each must-fix with:

- `[AC-N]` for a missed criterion;
- `[DEFECT]` for broken in-scope behavior;
- `[SECURITY]` for a shipping blocker;
- `[CI]` for a failed required check.

If a fix conflicts with `NG-N`, record
`[SCOPE-CONFLICT AC-N ↔ NG-N]` and escalate instead of prescribing code.

## Check exact merge evidence

Use `gh pr view` to read `headRefOid`, `mergeable`, and `mergeStateStatus`, then
`gh pr checks NUMBER --required`. Pending/unknown evidence ends the pass without
a verdict. Failed required checks and conflicts are must-fix. No required CI
requires human escalation.

Re-fetch the head SHA immediately before posting. Discard the review if it
changed.

## Post one SHA-bound verdict

```md
Finn Loop review of COMMIT_SHA

CI: required checks passed | failed | not configured
Mergeability: clean | conflicting

## Review

Summary: ...

## 1. Must fix before merge

None.

## 2. Should fix soon

None.

## 3. Safe to merge

Yes — automated evidence is complete. Apply `merge-approved` when you want it merged.
```

Say `Safe to merge: Yes` only when the automated evidence is complete; a later
merge pass reads that exact line, so it must be trustworthy.

Apply exactly one queue outcome:

- clean, green, no escalation: add `loop-approved`; remove
  `loop-changes-requested`;
- must-fix: add `loop-changes-requested`; remove `loop-approved`;
- scope conflict or no required CI: add `needs-human-review`; remove both
  automated labels and say `No — human decision required.`

Preserve an existing `needs-human-review` gate. Never push, change code, enable
auto-merge, or submit a formal GitHub review; use a comment plus labels. Merging
happens only in the first section of this skill, only on `merge-approved`.

## Look at it, do not only measure it

`tools/check.sh` cannot see layout. For any change touching UI, open the app in a
browser and look at it before saying `Safe to merge: Yes`. Serve it with
`python3 -m http.server 8000` and drive it **signed out** — set `S` directly and
call `render()` with `currentUid` null, so nothing can write to real data. Two
shipped bugs here were invisible in measurements and obvious in a screenshot.
