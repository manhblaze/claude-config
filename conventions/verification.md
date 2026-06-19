# Verification

Done means verified against real-world state. A green status, an opened or merged PR, a present attribute, or a successful-looking response shows that a step *ran* — not that the *effect* happened. Before reporting something done, deployed, or working, observe the actual effect.

This is sharpest for outward-facing claims. Status updates, ticket transitions, and deploy or launch announcements assert reality to other people; a false "done" or "deployed" misleads the team into building on something that may not exist.

## Claim vs proof

| Claim | Not proof | Proof |
| ----- | --------- | ----- |
| "deployed" / "live" | a PR opened, or even merged | the change observably serving from the running system — request it |
| "migration applied" / "data fixed" | a job or preview returning `status: success` | query the actual written records (both halves of the commit) |
| "feature works" | the element, attribute, or flag is present | exercise the behavior and observe the output |
| "done" / "complete" | the code was edited | tests pass and logs or output show the expected effect |

## Rules

- A claim about real-world state requires observing that state. Opening a PR is not deploying; a successful status is not a verified write; a present attribute is not a working behavior.
  Severity: SHOULD — MUST when the claim is outward-facing (status update, ticket transition, deploy or launch announcement)

- Report outcomes faithfully. If a step was skipped or a result is unverified, say so; do not round a partial result up to "done."
  Severity: MUST

See also `structural.md` (Testing Conventions): a milestone is not complete until its tests pass. Verification extends that discipline past the test boundary — to deploys, data effects, and observable behavior.
