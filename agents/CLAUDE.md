# agents/

Two distinct agent rosters live here. Pick the one that matches the workflow you're running; don't mix them in a single orchestration.

## Roster A — planner-skill execution roster

Lean roster wired into the [`planner`](../skills/planner/) skill's orchestrator (its scripts invoke these by name). Generic, paradigm: architect designs → developer implements → quality-reviewer reviews → technical-writer documents.

| Agent | Role |
| ----- | ---- |
| `architect.md` | system design for the planner flow |
| `developer.md` | implements specs with tests |
| `quality-reviewer.md` | reviews diffs/plans |
| `technical-writer.md` | docs |
| `debugger.md` | root-cause investigation |

**Do not rename or delete these** — the `planner` skill references them by name.

## Roster B — spec-driven pipeline roster

The 13 domain-specialist roles that staff the [`pipeline`](../skills/pipeline/PIPELINE.md) skill's 5-phase spine (Analysis → Planning → Implementation → Review → Monitoring). Project-agnostic; each project **binds the specifics** (domain, repos, stack, tracker, channel) in its own `CLAUDE.md`. Adopt by symlinking the ones you need into your project's `.claude/agents/`.

| Agent | Pipeline role |
| ----- | ------------- |
| `product-manager.md` | leads Analysis (scope/requirements) |
| `solutions-architect.md` | leads Planning (authors the spec); co-leads Analysis when architecture-shaped |
| `business-analyst.md` | gap/divergence analysis (Analysis) |
| `project-manager.md` | sequencing, dependencies, merge ordering |
| `backend-engineer.md` / `frontend-engineer.md` / `data-engineer.md` | staff Implementation (worktree per repo) |
| `qa-engineer.md` | tests-with-code; co-leads Review |
| `security-engineer.md` | independent blocking gate (dangerous-code surfaces) |
| `code-reviewer.md` | terminal Review gate |
| `devops-engineer.md` | leads Monitoring (Gate ② Deploy) |
| `ux-designer.md` | pulled in for user-facing flows |
| `document-specialist.md` | ADRs, runbooks, PR descriptions |

These two rosters overlap conceptually (e.g. `architect` ≈ `solutions-architect`, `quality-reviewer` ≈ `code-reviewer`) but use distinct names and serve distinct orchestration models — they coexist without collision.
