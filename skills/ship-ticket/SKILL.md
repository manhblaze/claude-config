---
name: ship-ticket
description: Per-session harness — fan ONE Jira ticket across the repos it touches (a git worktree per repo), running implement → test gate → code-reviewer → PR, with agent-tasks as the coordination/checkpoint tracker. Dry-run by default. Use when shipping a ticket that may span 420connect-platform / mfe-product-catalog / mfe-root-config etc.
---

# ship-ticket

Take ONE Jira ticket and fan it out across the repos it touches — a git worktree per repo — running the team's standard pipeline in each (implement → test gate → code-reviewer → PR) and recording progress to `agent-tasks` as the checkpoint/audit trail.

**Source-of-truth boundary:** Jira owns the ticket (MAV-xxxx under epic MAV-3389). `agent-tasks` `work_item`s are the per-run coordination/checkpoint mirror, carrying the Jira key as a tag/artifact. Never let the two diverge — Jira is authoritative for ticket state.

This is the per-session worker. The later orchestrator (Step 3 in the roadmap) reuses the same `agent-tasks` records, pulled by a scheduler instead of started by a human.

**Pipeline role:** this skill executes the **Implementation phase** of the [pipeline](../pipeline/PIPELINE.md). Its precondition is the ticket **spec** authored in Planning (`.claude/specs/<TICKET>-<slug>.md`) — for cross-repo tickets the spec's **frozen wire-contract section** is what keeps the parallel worktrees coherent. The **trivial fast-lane** (one-repo; no persistence / projection / wire-enum / auth / public-API / event-bus touch) skips the spec file (one-paragraph inline spec in the ticket) but still runs the security trigger-scan and, for any change feeding field-dependent logic over a persisted model, a real-datastore integration assertion.

## Inputs

- `TICKET` — Jira key, e.g. `MAV-3700`. Required.
- `REPOS` — repos under `$DEV_ROOT` (default `/Users/mdo/dev/420`) the ticket touches, e.g. `420connect-platform mfe-product-catalog`. Required (v1: the human names them; no auto-detection yet).
- `TYPE` — branch type `feat|fix|chore|...` (default inferred from the ticket's nature).
- `MODE` — `dry-run` (default) or `live`.
  - **dry-run**: creates worktrees + prints the per-repo plan and the tracker calls it *would* make. Opens no PRs, writes no Jira, writes no `agent-tasks`.
  - **live**: actually implements, runs gates, opens PRs, writes the tracker. (Wired after dry-run is validated.)

## Procedure (the orchestrator follows this)

### 0. Preflight
- Each `REPO` exists and is a git repo under `$DEV_ROOT`.
- Tracker health: if `MODE=live`, `curl -fsS localhost:3100/health` (agent-tasks API). If down, **WARN and fall back to the local-log tracker** (`$HARNESS_ROOT/<TICKET>/tracker.jsonl`) — the run still proceeds; checkpoints go to the local JSONL instead of `agent-tasks`.
- Pull the Jira ticket (Atlassian MCP) for title + intent.

### 1. Worktrees (deterministic — Bash)
`ship-worktrees.sh [--dry-run] create <TICKET> <TYPE> <repo>...`
Creates `$HARNESS_ROOT/<TICKET>/<repo>` per repo, branch `<TYPE>/<TICKET>`, from each repo's `origin` default branch. `--dry-run` prints the git commands only.

### 2. Tracker open (checkpoint seam)
Default impl = `agent-tasks` MCP; dry-run / daemon-down = log the calls to `tracker.jsonl`.
- `register_agent` — session identity (principal = the human running it).
- create `work_item` `kind=task`, `tags=[<TICKET>]`, title from Jira. Artifacts accrue: branch, PR url, gate status.

### 3. Fan out (Workflow — `fanout.js`)
Invoke `Workflow({ scriptPath: ".../ship-ticket/fanout.js" })` with
`args = { ticket, type, mode, intent, contract?, repos:[{name, path}] }`.
- Cross-repo ticket → the wire contract is **already pinned in the spec** (Planning phase); read it from `.claude/specs/<TICKET>-<slug>.md` as the precondition before the per-repo agents run in parallel. (Trivial fast-lane only: no spec file → pin it inline in the Jira ticket first.)
- Per repo: dry-run = a PLAN (files, approach, exact gate command, risks); live = implement in the worktree → run the repo's gate → `code-reviewer` subagent → fix findings.
- Tests are written **with** the code and each references its **acceptance-criterion id** from the spec; a criterion with no green test is an incomplete implementation (`code-reviewer` MUST-block). Integration tests run against the real datastore (a mocked datastore is a reject for data-shape-dependent logic).
- Each milestone → `applyTransition` on the `work_item` with an artifact (dry-run prints it).

### 4. PRs + Jira (live only)
- Per repo: `gh pr create`, title `<TICKET> | type(scope): …`, body's first line links the Jira ticket. Attach the `pr` artifact to the `work_item`.
- Jira transitions per conventions. **"Completed" = merged to main** (not here). **"Deployed" ≠ PR opened** — verify live before claiming it.

### 5. Report
Per-repo: branch, plan/PR, gate status, the `work_item` id, anything deferred. Verify before claiming done (see `.claude/conventions/verification.md`).

## Conventions baked in
Ticket-first Jira (epic MAV-3389) · ticket-keyed branches · FE gate `yarn jest && yarn typecheck && yarn e2e` (node 22) / BE gate `./gradlew :<module>:test` + real-Mongo integration · `code-reviewer` subagent gate (fix findings before PR) · PR linked to Jira · done = merged to main · PR ≠ deployed. See `.claude/conventions/` and the user's memory store.

## Cleanup
`ship-worktrees.sh [--dry-run] cleanup <TICKET> <TYPE> [--keep-branch] <repo>...` — removes the worktrees (and the branch unless `--keep-branch`).
