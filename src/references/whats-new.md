# FORGE — What's New

This file is read automatically on `/forge:resume` and `/forge:progress` to notify users of new features since their last session. The `forge_version` field in `.forge/forge.json` tracks the last version the user acknowledged.

---

## How to Use This File

When a workflow detects that the installed FORGE version (read from `~/.claude/forge-framework/package.json` → `version`) is newer than `.forge/forge.json` → `forge_version`, display the relevant section(s) below as a "What's New" banner, then update `forge_version` in `forge.json`.

If `.forge/forge.json` has no `forge_version` field, show the banner for the most recent version only, then set `forge_version`.

---

## v0.2.0 — 2026-04-10

**New commands:**
- `/forge:test` — pluggable test tier execution (brainstorm, configure, run, report)
- `/forge:retrofit` — reverse-engineer FORGE state from git history (join any project mid-flight)
- `/forge:dashboard` — single-screen project status view
- `/forge:debug` — persistent investigation workflow

**Loop updated:**
- VERIFY is now a distinct step: `PLAN → APPLY → VERIFY → UNIFY`
- `/forge:verify` is the dedicated verification command (E2E, MCP-driven, manual)

**Test architecture:**
- 10 pluggable tiers: static, unit, integration, e2e, mcp-driven, visual, performance, security, platform, manual
- 4 executor types: CLI, Skill, MCP server, Manual checklist
- Run `/forge:test brainstorm` to discover what to test before configuring

**CARL rules now enforced:**
- RULE_2: APPLY blocked if no approved PLAN.md exists
- RULE_7: Tasks must have `<verify>` criteria
- RULE_5: Blockers sync to STATE.md automatically
- RULE_11: Transition commit checked before UNIFY closes

---

## v0.1.0 — 2026-04-08

Initial FORGE release. Core loop (PLAN → APPLY → UNIFY), 28 commands, CARL rules 1–12, project init/milestone/phase management.

---

## Changelog Display Format

When showing the banner, use this format:

```
╔══════════════════════════════════════════════════════╗
║  FORGE Updated: v{old} → v{new}                      ║
╠══════════════════════════════════════════════════════╣
║  What's new in v{new}:                               ║
║                                                      ║
║  • [bullet 1]                                        ║
║  • [bullet 2]                                        ║
║  • [bullet 3]                                        ║
║                                                      ║
║  Full changelog: /forge:help → What's New            ║
╚══════════════════════════════════════════════════════╝
```

Keep it to 3–5 bullets. Most impactful changes only. Then continue with normal resume/progress flow.
