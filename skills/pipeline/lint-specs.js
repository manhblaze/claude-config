#!/usr/bin/env node
// no-status lint for a project's .claude/specs/ — a spec carries the CONTRACT, never
// ticket/PR/deploy STATE. State lives in the tracker + the PR (the source of truth).
// See PIPELINE.md (this skill).
//
// Usage: node lint-specs.js [specsDir]
//   specsDir defaults to ./.claude/specs (relative to cwd).
//   Exit 1 on any violation; exit 0 if clean or the dir does not exist yet.
'use strict'
const { readdirSync, readFileSync, existsSync } = require('fs')
const { join, resolve } = require('path')

const dir = resolve(process.argv[2] || join(process.cwd(), '.claude', 'specs'))
if (!existsSync(dir)) {
  console.log('no specs dir at ' + dir + ' — nothing to lint.')
  process.exit(0)
}

// A field/key at line start asserting authoritative state — belongs in the tracker/PR, not the spec.
const FORBIDDEN = /^\s*[-*]?\s*(status|state|done|completed|merged|deployed|approved|in[- ]progress)\s*[:=]/i

let violations = 0
for (const f of readdirSync(dir)) {
  if (!f.endsWith('.md') || f.startsWith('_')) continue // skip the template
  const lines = readFileSync(join(dir, f), 'utf8').split('\n')
  lines.forEach((line, i) => {
    if (FORBIDDEN.test(line)) {
      console.error(f + ':' + (i + 1) + ': status field in a spec — state belongs in the tracker/PR: ' + line.trim())
      violations++
    }
  })
}

if (violations) {
  console.error('\n' + violations + ' violation(s). The spec holds the contract; the tracker/PR hold status.')
  process.exit(1)
}
console.log('specs OK — no status fields.')
