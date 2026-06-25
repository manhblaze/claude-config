---
name: pipeline
description: A spec-driven SDLC — walk ONE ticket through the 5-phase spine (Analysis → Planning → Implementation → Review → Monitoring), staffing each phase with domain specialists and stopping only at the two user gates. Use when starting or continuing a ticket, deciding which specialist leads a phase, classifying a ticket's lane, or deciding when to stop for user approval. Canonical model: PIPELINE.md (this skill).
---

# pipeline

The orchestration playbook for the spec-driven SDLC spine. The **canonical model** — phases, leads, gates, Tier-1/Tier-2 triggers, the source-of-truth ⇄ spec planes, model tiering, the fast-lane — lives in [`PIPELINE.md`](PIPELINE.md). This skill is how the orchestrator *walks a ticket through it*. When the two disagree, `PIPELINE.md` wins.

Each project **binds the specifics** (epic/ticket scheme, channel, repos, agent roster, major-decision list) in its own `CLAUDE.md`. Below, "lead"/"experts" are roles — map them to your project's agents.

## 1. Pick the lane first

Classify magnitude from a thin Analysis (`PIPELINE.md` → trivial fast-lane):

- **trivial** (closed allow-list: one-repo AND no persistence / projection / wire-enum / auth / public-API / event-bus touch) → **Implementation + Review only**: inline one-paragraph spec in the ticket, one worktree, no separate spec file, no user gate. Still run the **security trigger-scan** + the **real-datastore backstop** for any change feeding field-dependent logic over a persisted model. Auto-promote to the full spine on any disallowed touch.
- **standard / major** → the full 5-phase spine below.

## 2. Walk the spine

1. **Analysis** — pick the lead (product owner; architect if architecture-shaped). Force the Tier-1 pulls on the enumerable surfaces (data engineer on schema/projection/index/migration/event-payload; security engineer advisory on auth/PII/secrets/raw-query/cross-tenant). Create `.claude/specs/<TICKET>-<slug>.md` from [`_TEMPLATE.md`](_TEMPLATE.md); fill the Analysis section, acceptance-criteria stubs, and the affected-repo fan-out set.
2. **Planning** — architect leads; author the spec (numbered, verification-tagged criteria). **Pin the wire contract** for cross-repo tickets. Pull data / security / UX / QA per trigger; the doc-writer publishes the ADR on a locked architecture call. **Gate ①:** if the converged spec is a major decision (per the project's CLAUDE.md), present recommendation + alternatives + tradeoff and **STOP** for the user. Record approval in the tracker bound to the spec's git SHA.
3. **Implementation** — hand to the worktree fan-out harness (e.g. [`ship-ticket`](../ship-ticket/SKILL.md)): one worktree per repo, in parallel; tests written *with* the code, each citing its **acceptance-criterion id**; independent security gate + terminal reviewer per worktree; draft PRs. A `NEEDS_DECISION` → `<escalation>` back to Gate ①.
4. **Review · QA** — reviewer + QA verify each AC against its tagged proof; cross-repo **re-join** for wire/enum drift; merge ordered by the pinned contract (consumer gated on producer merge).
5. **Monitoring** — the devops/ops role leads. **Gate ②** before any rollout (a standing pre-approval may cover the low-risk class). Observe-live; a *confirmed* regression mints a new ticket back to Analysis. Clean run → channel closeout.

## 3. Always

- **Two planes:** tracker/PR = source of truth; the spec file is additive and holds **no status** (`lint-specs.js` enforces it; run it against your specs dir).
- **`<escalation>`** is bottom-up, routes around the phase lead, and is recorded on the ticket — never steamroll dissent.
- **Verify before "done" / "deployed":** a merge is not a deploy; a green status is not a verified write.
- **KISS** — don't run the heavy spine on a trivial ticket; let promotion be automatic.

## Files

| File | What |
|------|------|
| `PIPELINE.md` | the canonical model (phases, gates, planes, fast-lane, tiering, the per-project decisions) |
| `_TEMPLATE.md` | the per-ticket spec template (copy to `.claude/specs/<TICKET>-<slug>.md`) |
| `lint-specs.js` | no-status lint: `node lint-specs.js [specsDir]` (default `.claude/specs`) |
