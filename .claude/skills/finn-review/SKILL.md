---
name: finn-review
description: Review one open Finn Loop pull request against its linked Linear contract and required GitHub checks, then post a SHA-bound verdict and queue label. Use for Finn Loop reviewer passes or recurring review automation. Never changes code or merges.
---

# Finn Review

Review one PR per invocation.

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

Yes — automated evidence is complete. A human still decides whether to merge.
```

Apply exactly one queue outcome:

- clean, green, no escalation: add `loop-approved`; remove
  `loop-changes-requested`;
- must-fix: add `loop-changes-requested`; remove `loop-approved`;
- scope conflict or no required CI: add `needs-human-review`; remove both
  automated labels and say `No — human decision required.`

Preserve an existing `needs-human-review` gate. Never push, merge, enable
auto-merge, or submit a formal GitHub review; use a comment plus labels.
