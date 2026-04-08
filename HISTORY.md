# Forge Framework — Change History

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
