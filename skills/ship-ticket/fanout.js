export const meta = {
  name: 'ship-ticket-fanout',
  description: 'Fan out one ticket across the repos it touches: dry-run = per-repo plan; live = implement -> gate -> review per worktree',
  phases: [
    { title: 'Contract', detail: 'pin the cross-repo wire contract (cross-repo tickets only)' },
    { title: 'Repos', detail: 'one agent per repo: plan (dry-run) or implement+gate+review (live)' },
  ],
}

let a = args || {}
if (typeof a === 'string') { try { a = JSON.parse(a) } catch (_) { a = {} } }
const ticket = a.ticket || 'TICKET'
const type = a.type || 'feat'
const mode = a.mode || 'dry-run'
const repos = Array.isArray(a.repos) ? a.repos : []
let contract = a.contract || null
if (!repos.length) { log('no repos passed in args.repos'); return { error: 'no repos' } }
log(`${mode} | ${ticket} | repos: ${repos.map(r => r.name).join(', ')}`)

const PLAN_SCHEMA = {
  type: 'object', additionalProperties: false,
  properties: {
    repo: { type: 'string' },
    slice: { type: 'string', description: "this repo's part of the ticket" },
    files: { type: 'array', items: { type: 'string' } },
    approach: { type: 'string' },
    gateCommand: { type: 'string', description: 'exact test/gate command for this repo' },
    contractTouch: { type: 'string', description: 'how this repo touches the shared wire contract, or n/a' },
    risks: { type: 'array', items: { type: 'string' } },
  },
  required: ['repo', 'slice', 'approach', 'gateCommand'],
}

// Phase 1 — pin the wire contract for cross-repo tickets, so FE/BE agree before parallel work.
if (repos.length > 1 && !contract) {
  phase('Contract')
  const beRepo = repos.find(r => /connect|platform|backend|api/i.test(r.name)) || repos[0]
  contract = await agent(
    `Cross-repo ticket ${ticket} spans: ${repos.map(r => `${r.name} (${r.path})`).join(', ')}.\n` +
    `Ticket intent:\n${a.intent || '(none provided)'}\n\n` +
    `Pin the WIRE CONTRACT both sides must agree on BEFORE they implement in parallel: endpoint path + HTTP method, request/response DTO field names & types, enum values byte-for-byte, and error shapes. The FE mirrors the BE wire shape exactly. Ground it by reading the relevant slice of the backend repo (${beRepo.name}) and the consuming frontend repo — sample, do NOT read everything. Output a concise contract spec in markdown. Do NOT modify any file.`,
    { label: 'pin-contract', phase: 'Contract' })
}

phase('Repos')

if (mode === 'dry-run') {
  const plans = await parallel(repos.map(r => () =>
    agent(
      `DRY-RUN planning. Ticket ${ticket}; repo ${r.name} at ${r.path} (read-only — this is the repo's main checkout, do NOT modify anything).\n` +
      `Ticket intent:\n${a.intent || '(none provided)'}\n` +
      (contract ? `\nShared wire contract to implement:\n${contract}\n` : '') +
      `\nProduce a concrete implementation PLAN for THIS repo's slice only: files you would touch, the approach (match existing patterns — KISS, reuse, FE mirrors BE wire shape), the EXACT gate command (FE: \`yarn jest && yarn typecheck && yarn e2e\` on node 22; BE: \`./gradlew :<module>:test\` + the real-Mongo integration test), how it touches the shared contract, and risks. Sample the repo to ground the plan; do NOT read everything, modify files, run tests, or open anything.`,
      { label: `plan:${r.name}`, phase: 'Repos', schema: PLAN_SCHEMA })))
  return { mode, ticket, type, contract, plans: plans.filter(Boolean) }
}

// LIVE mode — intentionally gated for the first iteration (agreed sequencing: validate the dry-run
// shape first, then wire live). The live pipeline per repo (worktree r.path, branch `${type}/${ticket}`):
//   impl agent (edit in worktree, no commit) -> gate agent (run the repo gate) -> code-reviewer subagent
//   -> return a result; the skill then does gh pr create + Jira + agent-tasks artifacts deterministically.
log('LIVE mode is not wired yet — validate dry-run first, then we enable it. Returning the plan instead.')
const plans = await parallel(repos.map(r => () =>
  agent(
    `DRY-RUN planning (live not yet enabled). Ticket ${ticket}; repo ${r.name} at ${r.path} (read-only). Produce the implementation plan: files, approach, exact gate command, contract touch, risks.`,
    { label: `plan:${r.name}`, phase: 'Repos', schema: PLAN_SCHEMA })))
return { mode: 'dry-run (live not yet enabled)', ticket, type, contract, plans: plans.filter(Boolean) }
