# <TICKET> — <slug>

> SPEC — the canonical driving contract for this ticket. Source of truth for ticket / merge / deploy state is **the tracker + the PR**, never this file. Do **not** add a status field. Approval binds this file's git blob SHA (see the `pipeline` skill's PIPELINE.md).

- Ticket: <tracker-url>/<TICKET>  ·  Epic: <EPIC>
- Magnitude: trivial | standard | major
- Affected repos (fan-out set): <repos the ticket touches>

## Analysis

- Problem:
- In scope / Out of scope:
- Divergence / variants:
- Risks:
- Acceptance-criteria stubs:
- Experts pulled: [list] / none because [reason]

## Spec (the contract)

### Acceptance criteria
Numbered; each tagged with a verification method (`unit` | `real-datastore integration` | `browser+screenshot` | `live-observe`).

1. **AC-1** — <behavior> — verify: `<method>`
2. **AC-2** — <behavior> — verify: `<method>`

### Wire contract — FROZEN at Planning (cross-repo tickets only)
- producer `<enum/field>`  ⇄  consumer `<field>`  (field-for-field)

### Data contract
- schema / index / migration + backfill plan + projection load-sites to update

### Security contract
- expected authz scope per endpoint; PII / secrets handling

### Verification recipe
- what "observed-live" means for THIS ticket (the Monitoring checklist)

### ADR
- link (major decisions only)

## Implementation Notes (per repo, append-only)

- `<repo>`: branch · what was built · gate status · deviations-from-spec + rationale

## Review

- per AC: verified / failed + proof (test name · integration query result · screenshot ref)
- findings (MUST / SHOULD / COULD)

## Monitoring

- deploy status · canary metric reading · live-verified proof · migration side-effect query results
- outcome: live-verified (closeout posted) | regression → new ticket `<KEY>`
