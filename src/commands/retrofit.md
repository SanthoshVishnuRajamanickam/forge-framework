---
name: forge:retrofit
description: Initialize FORGE on an existing project by reverse-engineering git history and codebase
argument-hint: "[--mode=standard|full] [--since=v1.0] [--resume] [--refine=history]"
allowed-tools: [Read, Write, Bash, Glob, Grep, Task, AskUserQuestion]
---

<objective>
Reverse-engineer complete FORGE state from an existing project's git history,
codebase structure, package metadata, and documentation. Produces the same
`.forge/` directory that `/forge:init` creates, but populated with real data
instead of asking the user to describe what already exists.

**Modes:**
- `standard` — PROJECT.md + ROADMAP.md + STATE.md + codebase map (~90s, ~28K tokens) [default]
- `full` — + MILESTONES.md + phase reconstruction + plan archaeology (~3min, ~50K tokens)

**Flags:**
- `--since=v1.0` — only analyze history from this tag forward (fork point, migration)
- `--resume` — resume an interrupted retrofit from checkpoint
- `--refine=history` — re-run only the history agent, keep existing codebase map
</objective>

<execution_context>
@src/workflows/retrofit-project.md
@src/references/retrofit-history.md
</execution_context>

<process>
**Follow workflow:** @src/workflows/retrofit-project.md

The workflow implements:
1. Pre-flight checks (existing .forge/, resume state, project size routing)
2. Workflow shape detection (branches+tags / squash-merge / trunk-based)
3. Parallel agent spawn (codebase map + history analysis)
4. Synthesis of findings into draft FORGE state
5. Confidence-scored approval checklist with evidence
6. User review + core_value input
7. Sensitive data scan + write files
8. Commit + route to /forge:progress
</process>

<success_criteria>
- [ ] .forge/ directory created with all standard files
- [ ] PROJECT.md populated from detected metadata + user core_value
- [ ] ROADMAP.md reflects actual milestone/phase structure from git history
- [ ] MILESTONES.md (full mode) has entries with git ranges and stats
- [ ] STATE.md set to IDLE, ready for first /forge:plan
- [ ] Codebase map generated (standard/full modes)
- [ ] User approved all inferred data before write
- [ ] No sensitive data leaked into .forge/ files
- [ ] Checkpoint saved for resume capability
</success_criteria>
