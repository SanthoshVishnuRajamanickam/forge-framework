# Forge Framework — Change History

## v0.2.0 — 2026-04-10 — Phase 2: Framework Hardening + Test Flows + Retrofit

Major quality pass driven by parallel agent-team reviews (6 review agents, 4 domain expert auditors). Forge is now a production-grade framework with its own identity beyond the PAUL clone.

**Framework Hardening (16 gaps fixed):**
- Installer: `src/carl` included, error handling, backup-on-reinstall, extensionless file path replacement
- Package: `repository`, `bugs`, `homepage` fields for npm publish readiness
- Commands: frontmatter added to `config.md`, `map-codebase.md`; argument-hints filled for 5 commands
- New `/forge:debug` command exposing previously-orphan debug workflow
- CARL rule enforcement wired into workflows: RULE_2 (plan validation), RULE_5 (blocker sync), RULE_7 (verify tags), RULE_11 (transition commit check)
- Approval ritual standardized with canonical signal list
- `git-strategy.md` reference wired into `apply-phase` and `complete-milestone`
- Help synced to 31 commands

**Test Flow Architecture (new subsystem):**
- 10 pluggable test tiers: static, unit, integration, e2e, mcp-driven, visual, performance, security, platform, manual
- 4 executor types: CLI command, Skill, MCP server, Manual checklist
- Executor extensions: lifecycle hooks, execution target (host/simulator/device/cloud-farm), environment context, timing assertions, parallel sharding, network conditioning, build variants
- Failure taxonomy: code_bug, environment, infrastructure, flaky, test_debt, config — with classification flow and quarantine
- Test data management: fixtures, factories, seeds, snapshots
- Safety traceability: ISO 26262 / DO-178C support with requirement-to-test matrix, MC/DC coverage
- `/forge:test` command: brainstorm, configure, run, report subcommands
- `/forge:test brainstorm` — risk-first guided discovery before configuration
- Audited by 4 domain experts: embedded, web/fullstack, mobile, QA architect

**Retrofit (new subsystem):**
- `/forge:retrofit` — initialize FORGE on existing projects by reverse-engineering git history
- 2 modes: standard (4 sonnet agents, ~28K tokens) and full (+ haiku history agent, ~50K tokens)
- CHANGELOG parsed as primary source (higher fidelity than git)
- Tag-driven chunking (no lossy commit sampling)
- Workflow shape detection: standard, squash-merge, trunk-based, rebase, multi-release
- Pre-processing gates: bot filter, fork detector, secret scanner
- Confidence scores (HIGH/MEDIUM/LOW) with evidence drill-down
- Checkpointing for resume on failure, `--refine=history` for incremental fixes
- 10 edge cases handled: monorepo, SVN import, feature flags, single-commit repos, etc.
- Audited by 3 experts: accuracy/release engineer, chaos tester, token-cost/UX engineer

**Documentation:**
- README: quickstart, retrofit path, backup behavior
- CONTRIBUTING.md, CODE_OF_CONDUCT.md
- `src/carl/README.md` documenting CARL manifest
- Interactive diagrams: workflow, test flows, retrofit flow (assets/*.html)

**31 commands. 0 stale paul references. All cross-references verified.**

---

## v0.1.0 — 2026-04-08 — Phase 1: Clone PAUL

Forge Phase 1 complete. This release is a byte-for-byte clone of `paul-framework@1.2.0` with a mechanical case-preserving rename (`paul` → `forge`). No new functionality added; this establishes the baseline on which future subsystems will be built.

**What works:**
- `npx forge-framework --global` / `--local` installs forge alongside PAUL without conflict.
- All 28 PAUL commands are available as `/forge:*` equivalents.
- Templates, workflows, references, and rules are present in `~/.claude/forge-framework/`.
- `/forge:help` displays identically to `/paul:help` except for rename pass substitutions.

**What's next (Phase 2):**
- PRD intake subsystem (`/forge:intake`, `/forge:add-feature`, `/forge:reconcile`)
- Multi-agent xlsx generation flow
- Cloned brainstorming skill (forge-intake-brainstorming)
- Source xlsx two-way sync

See `docs/superpowers/specs/2026-04-08-forge-autonomous-engineering-design.md` in the WhatsappAIAgent repo for the full forge specification.
