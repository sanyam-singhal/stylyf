# BYOC + BYO-Codex White-Label App Assembly Line Plan

_Date: 2026-04-28_

## 1) Product thesis and positioning

Build Stylyf Builder into a **white-labeled “prompt-to-production” factory** for internal, focused web apps where:

- Non-technical teams can create deployable business apps quickly.
- Engineering keeps control over architecture, design system, security, and deployment standards.
- AI is used for speed, while deterministic scaffolding enforces quality.

**Positioning statement:**

> “From prompt to deployable, policy-compliant internal app in hours—without throwing away generated code.”

## 2) Ground truth from current market signals (2025–2026)

### Observed competitor strengths to copy

1. **Git-native export/sync is table stakes** (Lovable): generated apps must leave the platform cleanly and support real engineering collaboration.
2. **Design-system-conditioned generation is becoming core** (Bolt): teams expect generated UI to use real components/tokens, not hallucinated style layers.
3. **Agent/model flexibility matters** (Bolt/OpenCode): different phases need different cost/quality profiles.
4. **Enterprise controls are product-critical** (Lovable security + SSO): admin-level guardrails and security posture visibility are now baseline.

### Observed market gaps to exploit

1. **“Vibe” output often fails production constraints**: architecture drift, weak security defaults, and styling inconsistency.
2. **Non-technical users still need prompt engineering skill** to avoid poor structure.
3. **Apps are often hard to standardize post-generation** when no contract-driven harness exists.

### Strategic implication

Stylyf should compete less on “best chatbot” and more on:

- **Assembly-line reliability** (repeatable outputs).
- **Policy + design compliance by construction**.
- **Fast human handoff to engineering for custom logic only**.

## 3) Target operating model

## 3.1 Roles

- **Operator (non-technical):** defines intent in business language.
- **Template owner (platform team):** maintains approved app blueprints.
- **Design system owner:** curates tokens/components and governance.
- **Security/compliance owner:** enforces policies and release gates.
- **Engineer (finisher):** writes custom business logic and integrations.

## 3.2 Control planes

1. **Prompt control plane**: guided intent capture + constrained prompt compiler.
2. **Code generation plane**: Codex-powered edits inside controlled repo harness.
3. **Policy plane**: static/dynamic checks, dependency policies, secret handling.
4. **Design plane**: component/token governance and visual linting.
5. **Release plane**: preview → QA checklist → production deploy.

## 4) Core architecture blueprint

## 4.1 Deterministic scaffold first, generative second

Never let free-form generation start from an empty repo.

1. User selects an **App Contract Template** (e.g., CRUD dashboard, approval flow, intake portal).
2. Template instantiates:
   - stack and folder layout
   - auth/RBAC skeleton
   - data access conventions
   - design primitives
   - test scaffolding
   - deployment pipeline config
3. Codex is constrained to mutate allowed surfaces:
   - `/features/*`
   - `/workflows/*`
   - typed schema files
   - copy/content zones

## 4.2 App contract spec (source-owned)

Define a versioned contract schema (JSON/YAML) per generated app:

- `app.kind`
- `entities[]`
- `roles[]`
- `screens[]`
- `workflows[]`
- `integrations[]`
- `non_functional`: perf, audit, residency, retention

The contract drives codegen and validations, so the prompt becomes input to a compiler rather than direct codegen.

## 4.3 BYOC + model routing

Support Bring Your Own Codex/model endpoints with per-stage routing:

- **Planner model** (cheap): intent normalization + decomposition.
- **Builder model** (strong): implementation and refactors.
- **Verifier model** (cheap/medium): lint, policy, security review pass.

Add tenancy-level controls:

- allowed providers/models
- max token budgets per stage
- audit log of prompts/tool calls/diffs

## 4.4 State and lineage

Track every generation as immutable artifacts:

- prompt snapshot
- normalized intent spec
- contract version
- generated commit hashes
- check results
- deploy metadata

This enables reproducibility, rollback, and governance audits.

## 5) Design system strategy (critical differentiator)

## 5.1 Source of truth

Treat `packages/stylyf-source` as canonical design grammar and inventory.

## 5.2 Three-tier design enforcement

1. **Token lock**: only approved tokens available in generated code.
2. **Component allowlist**: generated UI can only import approved primitives/composites.
3. **Layout grammar**: page-level composition templates constrain spacing hierarchy and responsiveness.

## 5.3 Visual quality gates

- screenshot regression on key routes
- semantic UI checks (contrast, focus order, empty states)
- “no rogue CSS” policy (block ad hoc style values except approved zones)

## 6) Prompt-to-production workflow

## 6.1 Stage A — Intent capture

Replace free-text blank input with guided structured intake:

- business objective
- actors/roles
- records/data entities
- key workflows
- success metrics
- integrations
- compliance flags (PII/PHI/finance)

## 6.2 Stage B — Intent compiler

Transform user intent into:

- normalized functional spec
- app contract draft
- risk checklist
- open questions for user approval

## 6.3 Stage C — Contract approval

User approves generated contract before code is touched.

## 6.4 Stage D — Controlled generation

Codex operates in bounded edit scopes with a test-first loop:

1. generate/update feature code
2. run checks
3. auto-fix deterministic failures
4. summarize unresolved items

## 6.5 Stage E — Human polish lane

Engineer only handles:

- custom integrations
- complex domain rules
- edge-case UX refinements

## 6.6 Stage F — Release lane

- preview deploy
- QA checklist
- security + dependency scan gates
- production deployment with rollback

## 7) Safety, compliance, and enterprise-readiness

## 7.1 Mandatory safeguards

- secret detection and redaction
- dependency vulnerability blocking by severity threshold
- policy-as-code (OPA or equivalent) for release gating
- tenant data isolation at storage and execution layers

## 7.2 Identity and access

- SSO/SAML/OIDC for enterprise tenants
- role-scoped actions in builder and generated app
- auditable admin actions

## 7.3 AI safety and abuse controls

- prompt injection filters for imported docs/specs
- outbound integration allowlists
- action approval step for destructive operations

## 8) Product surfaces to build in Stylyf Builder

1. **Blueprint Library**
   - curated app templates
   - domain packs (ops, HR, finance, support)
2. **Intent Studio**
   - guided intake + contract preview
3. **Generation Console**
   - live diffs, logs, checks, and budgets
4. **Policy Center**
   - security, design, and compliance rules
5. **Publish Hub**
   - env config, deployment targets, rollback

## 9) Implementation roadmap (12 months)

## Phase 1 (0–8 weeks): Foundation and constraints

- define app contract v1 schema
- build deterministic project templates
- enforce edit-scope sandboxing
- ship generation lineage logging

**Exit criteria:** repeatable generation of 2 internal-app archetypes with zero manual scaffolding.

## Phase 2 (2–4 months): Design-system-native generation

- add token/component allowlists
- wire visual checks + route screenshot gates
- ship layout grammar rules

**Exit criteria:** >90% UI conformity score against design system checks.

## Phase 3 (4–6 months): Enterprise control plane

- SSO + RBAC for builder
- policy center with release gates
- tenant-level model/budget governance

**Exit criteria:** enterprise pilot tenant passes security review baseline.

## Phase 4 (6–9 months): Deployment and integration maturity

- pluggable deployment targets (Vercel/Netlify/custom CI)
- integration connectors (Supabase, Stripe, Slack, email)
- migration-safe schema evolution tooling

**Exit criteria:** median prompt-to-preview under 30 minutes for standard templates.

## Phase 5 (9–12 months): Scale and ecosystem

- template marketplace (internal/private first)
- advanced observability (per-stage latency/cost/error)
- “one-click hardening” for production posture

**Exit criteria:** 3+ design partners in ongoing production use.

## 10) Metrics and SLAs

## North-star metrics

- **Prompt-to-preview time (P50/P90)**
- **Prompt-to-production lead time**
- **Post-generation manual code ratio** (target: custom logic only)
- **Design-system compliance score**
- **Security gate pass rate on first run**

## Operational SLAs

- generation success rate
- check pipeline reliability
- deployment success rate
- mean rollback time

## 11) Suggested technical stack decisions

- **Generated app default:** Next.js + TypeScript + strict lint/format + tested auth/data adapters
- **Design:** tokenized system + approved component package only
- **Data:** typed schema layer (drift-detectable migrations)
- **Policy:** central policy engine + CI gate adapters
- **Observability:** structured events for each generation stage

## 12) Build-vs-buy guidance

Build in-house:

- app contract compiler
- design grammar enforcement
- policy and release gates
- lineage/audit system

Leverage existing providers for:

- model inference endpoints
- deploy hosting
- identity providers
- vulnerability scanning where practical

## 13) Immediate next 30-day execution plan

Week 1:

- lock product requirements for contract v1
- pick first 2 archetypes (e.g., approvals portal + internal CRM-lite)

Week 2:

- implement deterministic template instantiation and edit boundaries
- add generation logs + immutable run records

Week 3:

- add intent intake UI and contract preview/approval flow
- wire policy checks: lint/test/secrets/dependency scan

Week 4:

- run 10 pilot generations with non-technical users
- measure prompt-to-preview, manual-fix ratio, and design compliance
- prioritize next iteration backlog

## 14) Risks and mitigations

1. **Risk:** high variance in AI output quality.
   **Mitigation:** contract-driven generation + bounded edit scopes + automated verifier loop.

2. **Risk:** non-technical users struggle to specify requirements.
   **Mitigation:** guided intake with examples, contract preview, and clarification questions.

3. **Risk:** engineering rejects generated code quality.
   **Mitigation:** enforce architecture/style contracts + design-system-native components.

4. **Risk:** enterprise blockers (security/legal).
   **Mitigation:** SSO, audit logs, policy gates, and explicit data handling controls from day one.

## 15) Research references reviewed

- Lovable docs: GitHub sync, security, SSO controls.
- Bolt docs/blog/release notes: design system agents, model guidance, roadmap updates.
- OpenCode docs/GitHub: open terminal agent patterns, ACP support, tool-oriented architecture.
- OpenAI docs: Codex cloud workflow, Responses API tools, migration direction, computer-use caveats.

