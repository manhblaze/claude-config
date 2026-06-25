# Pipeline — the spec-driven SDLC spine

A reusable operating model: a **spec-driven (SDD) 5-phase control-flow spine**, each phase **led by one specialist** and **staffed by experts pulled in on a trigger**. It formalizes a roster-based collaboration model, and adds two things — Monitoring as a first-class phase, and the **spec** as the driving contract.

This is the project-agnostic canonical model. Each adopting project **binds the specifics** in its own `CLAUDE.md`: the epic/ticket scheme, the project chat channel, the repos a ticket may touch, the specialist roster, and the project's "major-decision" list. Where this doc says "your project's …", read the project binding.

Methodology is **SDD, not TDD**: the spec (acceptance-criteria) drives the work; tests are written *with* the implementation and gated green pre-PR — not tests-first.

## The two planes (never merge them)

- **Source of truth** (authoritative, outward-facing): the **issue tracker** (status/approvals), the **pull request** (code/merge/verification proof), the **persistent memory** (durable learnings), and the **team channel** (closeout). The only answer to *is-it-done / merged / deployed*.
- **Additive spec spine**: ONE file per ticket — `.claude/specs/<TICKET>-<slug>.md` — committed into the touched repo(s) on the ticket branch, with append-only sections `Analysis → Spec → Implementation Notes → Review → Monitoring`. It carries the contract and the *why*.
  - HARD RULES (lint-enforced via `lint-specs.js` in this skill): the spec **never stores ticket/PR status**; contract text is **never copied into the tracker** (the tracker gets a link + the approval transition); **approval binds the spec's git blob SHA** — a post-approval edit changes the hash and fails closed in CI until re-gated. Any external checkpoint/coordination store stays a mirror tagged with the ticket key; on any conflict, the tracker/PR win.

## The two human gates (the only planned stops)

The human gates **decisions, not phase transitions** — every other boundary is autonomous (no human-as-conveyor).

- **Gate ① — Planning-exit.** Fires only when the converged spec carries a **major-decision** trigger (your project's CLAUDE.md "major decision" list). The orchestrator presents the recommendation + alternatives + explicit tradeoff and STOPS. Magnitude is re-evaluated from the *actual* design here, never inherited from Analysis.
- **Gate ② — Deploy.** Fires before any staging/prod rollout, cross-system contract activation, or schema cutover. A **standing pre-approval** (recorded in the tracker) may cover an enumerated low-risk class (e.g. a single front-end bundle, no schema/event-contract); schema / cross-system / prod always stop.

## Escalation (orthogonal halt)

`<escalation>{type,context,issue,needed}</escalation>` is a first-class **bottom-up** interrupt any specialist or worktree can raise in any phase. It routes **around the phase lead** and records dissent **verbatim on the source of truth (a tracker comment)**, so a lead can never bury it. `BLOCKED` → the unblocking colleague (may stay in-phase); `NEEDS_DECISION` → Gate ①; `UNCERTAINTY` / dissent → the user. A worktree-local escalation halts only that worktree; only a shared-contract issue halts the whole ticket.

## The phases

Phase leads/experts are named by **role**; bind them to your project's actual agents.

| # | Phase | Lead role | Tier-1 mandatory pulls (on the enumerable surface) | Gate | Exit artifact |
|---|-------|-----------|-----------------------------------------------------|------|---------------|
| 1 | Analysis | product owner (architect co-leads if architecture-shaped) | data engineer (schema/projection/index/migration/event-payload); security engineer (advisory) | — | spec *skeleton* (Analysis §) |
| 2 | Planning (spec) | architect (+ product owner on criteria) | data engineer; security engineer; the implementing engineers (pin wire contract); QA (criteria testable) | **① major decision** | the **canonical spec** (Spec §) + ADR |
| 3 | Implementation | implementing engineers, one worktree per repo (parallel) | QA (tests-with-code); security engineer (independent blocking gate); reviewer (terminal) | — (escalate on NEEDS_DECISION) | per-repo draft PRs + spec (Impl Notes §) |
| 4 | Review · QA | reviewer (terminal); QA co-leads | security engineer (sign-off on dangerous paths); data engineer (migration side-effects) | — | findings (Review §); merge on all-MUST-resolved |
| 5 | Monitoring | devops/ops engineer (+ QA) | data engineer; implementing engineers (verify live) | **② deploy** | live verdict (Monitoring §) |

Per-phase detail:

1. **Analysis** — frame the problem; produce the spec *skeleton* (acceptance-criteria stubs, in/out-of-scope fence, the **affected-repo fan-out set**, divergence flags, proposed magnitude). No code. Creates `.claude/specs/<TICKET>-<slug>.md` from the template.
2. **Planning (spec authoring)** — author the canonical spec: **numbered acceptance criteria, each tagged with a verification method** (unit test / real-datastore integration / browser+screenshot / live-observe). For cross-repo tickets, **pin the wire contract** (consumer mirrors producer, field-for-field) as a frozen spec section *before* any fan-out. **Gate ①** if it's a major decision. Record approval in the tracker bound to the spec's git SHA.
3. **Implementation (fan-out)** — hand to the worktree fan-out (one worktree per repo, in parallel). Tests written *with* the code, each citing its acceptance-criterion id; a criterion with no green test is an incomplete implementation. Integration tests run against the **real datastore** (a mocked datastore is a reject for data-shape-dependent logic). Independent security gate + terminal reviewer per worktree, before the PR opens.
4. **Review · QA** — the numbered criteria *are* the review checklist; each needs observed proof per its tagged method. Cross-repo **re-join**: read all PRs together for wire/enum drift; merge ordered by the pinned contract (a consumer never lands ahead of its producer).
5. **Monitoring** — observe-live against the spec's verification recipe (`done=merged`, `deployed=observed-live`). **Gate ②** before rollout. The only phase with a **backward edge**: a *confirmed* regression **mints a new/linked ticket** (never an in-place reopen) inheriting the spec, re-entering at Analysis. Clean run → channel closeout once merged AND live-verified.

## Trivial fast-lane (KISS)

Magnitude (`trivial | standard | major`) is a recorded, justified output of a thin Analysis. **Trivial is a closed allow-list:** one-repo AND touches **no** persistence read/write, **no** projection/load-site, **no** serialized wire/enum, **no** auth/scope, **no** public API surface, **no** event bus / cross-system contract. Anything outside the allow-list is `standard` by default.

Trivial collapses the spine to **Implementation + Review** (one-paragraph inline spec in the ticket — no separate spec file, no ADR, one worktree, no user gate). **Magnitude-independent backstops still run:** the security trigger-scan, and — for any fix touching code feeding **field-dependent logic over a persisted model** — at least one **real-datastore integration assertion** (data-shape bugs are invisible to unit tests and diff-level scans). Default-simple; **auto-promote** to the full spine on any disallowed touch (promotion is automatic, demotion never is).

## Model tiering (legibility, not a hard rule)

Strong model where the work **decides**: Analysis framing, Planning/spec authoring, the reviewer, the architect, the security engineer adjudicating a dangerous path. Balanced model where it **executes a decided spec**: per-worktree implementation, QA test authoring, monitoring polling. A pulled-in strong-model specialist keeps its tier inside a balanced-model phase. The lead may raise a tier for a genuinely hard ticket.

## Decisions each adopting project makes

Bind these once, in the project's CLAUDE.md or a decisions doc:

1. Where the spec lives (recommended: **committed in each touched repo** on the ticket branch) and whether tracker approval **binds its git blob SHA**.
2. The exact **closed allow-list** that defines a "trivial" ticket + the mandatory real-datastore backstop.
3. Whether the Deploy gate has a **standing pre-approval** for an enumerated low-risk class (schema / cross-system / prod always stop).
4. The **Tier-1 mandatory-pull trigger list** (reuse the project's major-decision + dangerous-code lists; forced, not lead discretion).
5. Whether execution automation (the worktree fan-out harness) runs live or stays dry-run while the conventions land first.

## Running it

The orchestrator walks a ticket through this via the [`pipeline` skill](SKILL.md); the Implementation phase hands to a worktree fan-out harness (e.g. the [`ship-ticket`](../ship-ticket/SKILL.md) skill); the Monitoring phase is led by your project's devops/ops role.
