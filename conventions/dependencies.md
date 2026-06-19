# Dependency Licensing

Only introduce third-party dependencies under permissive, commercial-safe licenses, and verify the license **before** adding the dependency. License obligations are inherited by every product that ships the code; a copyleft or source-available license can compel source disclosure or block commercial distribution, and that exposure cannot be undone once the dependency ships.

## Allowed vs restricted

| License | Status |
| ------- | ------ |
| Apache-2.0 (ideal — patent grant), MIT, BSD-2-Clause, BSD-3-Clause, ISC | Allowed |
| GPL, AGPL, LGPL, MPL, EPL, CDDL, SSPL, BSL / "source-available", "non-commercial", or unclear | Restricted |

Anything not clearly Allowed is Restricted until proven otherwise. AGPL in a hosted product is a hard stop.

## Rules

- Verify against the **resolved artifact's own license metadata**, not memory or a repository's top-level LICENSE — a published package can relicense or vendor sublibraries under different terms. Check the jar's `META-INF/.../pom.xml` `<licenses>`, the npm package's `license` field, etc.
  Severity: SHOULD

- Adding a dependency under a Restricted (or unverified) license: **stop and surface the tradeoff to the user** — the license, the obligation it imposes, and the alternatives considered. Never self-approve a Restricted license.
  Severity: MUST

- Prefer a dependency **already vetted in the codebase** over introducing a new one for the same capability — it is already approved and avoids version skew.
  Severity: SHOULD
