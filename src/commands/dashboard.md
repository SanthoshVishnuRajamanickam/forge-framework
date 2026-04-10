---
name: forge:dashboard
description: Single-screen view of entire project state — milestones, loop, tests, flows, health
argument-hint: "[--html]"
allowed-tools: [Read, Bash, Glob, Grep]
---

<objective>
Display a comprehensive, real-time dashboard of the FORGE project state. One command,
complete situational awareness — milestones, current loop position, test profile,
special flows, recent activity, blockers, and health metrics.

**Flags:**
- `(no argument)` — terminal output (formatted text)
- `--html` — generate interactive HTML dashboard at `.forge/dashboard.html` and open it
</objective>

<execution_context>
@src/workflows/dashboard.md
</execution_context>

<process>
**Follow workflow:** @src/workflows/dashboard.md
</process>

<success_criteria>
- [ ] All .forge/ state files read and synthesized
- [ ] Project identity, milestone progress, loop position displayed
- [ ] Test profile status shown (configured tiers + coverage)
- [ ] Special flows listed with status
- [ ] Recent git activity displayed
- [ ] Blockers and deferred issues surfaced
- [ ] Suggested next action shown
</success_criteria>
