# FORGE Cheat Sheet

## The Loop

```
PLAN ──▶ APPLY ──▶ VERIFY ──▶ UNIFY ──╮
  ╰──────────────────────────────────────╯
```

## Core Commands

| Command | What it does |
|---------|-------------|
| `/forge:init` | Scaffold `.forge/`, set up project |
| `/forge:plan` | Write PLAN.md with tasks + acceptance criteria |
| `/forge:apply` | Execute the approved plan |
| `/forge:verify` | Run tests, UAT, confirm it works |
| `/forge:unify` | Reconcile plan vs actual, close the loop |

## Session Commands

| Command | What it does |
|---------|-------------|
| `/forge:pause` | Save state + handoff |
| `/forge:resume` | Restore from handoff |
| `/forge:progress` | What should I do next? |
| `/forge:dashboard` | Full project snapshot |

## What Should I Run?

| Situation | Commands |
|-----------|----------|
| Starting a project | `init` → `milestone` → `plan` |
| Resuming work | `resume` or `progress` |
| Ready to build | `apply` |
| Done building | `verify` → `unify` |
| Stuck on a bug | `debug` |
| Planning next work | `discuss` → `plan` |
| Between milestones | `complete-milestone` → `milestone` |

## CARL Rules (the non-negotiables)

1. No code without an approved plan.
2. Every apply closes with unify.
3. Every task needs `<verify>` criteria.

---

*32 commands total. Run `/forge:help` for the full reference.*
