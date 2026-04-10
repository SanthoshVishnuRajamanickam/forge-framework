# Claude Code Discussions Post

**Category:** Show and Tell

**Title:** Forge — 32-command engineering framework with pluggable test flows and git history retrofit

**Body:**

---

I've been building with Claude Code daily for months. It's incredibly powerful — when context is managed well. The problem: context rots across sessions, plans orphan, tests run manually, and joining an existing project means explaining everything from scratch.

So I built **Forge** — an open-source framework that gives Claude Code structured memory across the entire engineering lifecycle.

## What makes it different

**Retrofit existing projects** — Most frameworks assume you're starting fresh. Forge's `/forge:retrofit` command reverse-engineers your project state from git history:

```
/forge:retrofit --mode=full
```

It spawns 5 parallel agents that analyze your codebase + git tags + changelogs + commit patterns, then presents confidence-scored findings for approval:

```
═══ FORGE RETROFIT REVIEW ═══

ROADMAP.md:  [HIGH confidence — from tags + CHANGELOG]
  v1.0 (2024-03): 4 phases ✓ complete
    ├─ Authentication      (38 commits, 12 files)
    ├─ API Layer           (45 commits, 18 files)
    ├─ UI Components       (67 commits, 24 files)
    └─ Deployment          (12 commits, 6 files)
  v2.1 (active): 2 phases ◐ in progress
```

It handles edge cases: squash merges, trunk-based development, bot commits, fork detection, monorepos.

**Pluggable test architecture** — 10 test tiers (static, unit, integration, e2e, MCP-driven, visual, performance, security, platform, manual), each bound to configurable executors:

- **CLI:** `npm test`, `pytest`, `ctest` — FORGE reads exit code + output
- **Skill:** `/playwright-cli` or any custom skill
- **MCP Server:** AI uses Playwright/PSIX/dSPACE MCP tools directly — no scripts, the acceptance criteria ARE the test spec
- **Manual:** auto-generated checklists from acceptance criteria

The MCP-driven testing is the interesting one — Claude reads your acceptance criteria (Given/When/Then), translates them into MCP tool calls, takes screenshots as evidence, and generates a TEST-REPORT.md. No test scripts written.

**Dashboard** — One command, complete situational awareness:

```
/forge:dashboard
```

Shows milestones, loop position, test profile, special flows, git health, blockers, and suggested next action.

## The loop

```
PLAN → APPLY → VERIFY → UNIFY → repeat
```

CARL rules enforce discipline: no code without a plan (RULE_2), every task needs `<verify>` criteria (RULE_7), blockers sync to STATE.md (RULE_5), one commit per phase (RULE_11).

## Install

```bash
npx forge-framework --global
```

Or as a Claude Code plugin (auto-updates) — see the README for config.

**32 commands. MIT license. Zero dependencies.**

GitHub: https://github.com/SanthoshVishnuRajamanickam/forge-framework

Happy to answer questions or hear feedback. This started as a personal tool and grew into something I think others might find useful.
