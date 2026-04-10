# FORGE Framework

Autonomous engineering framework — plan/apply/verify/unify loop with pluggable test flows, git history retrofit, and project dashboard.

## Commands

All commands are in `src/commands/` and use the `/forge:` prefix.

### Core Loop
- `/forge:init` — scaffold .forge/ with conversational setup
- `/forge:plan` — write a PLAN.md for the current phase
- `/forge:apply` — execute an approved plan
- `/forge:verify` — user acceptance testing
- `/forge:unify` — reconcile plan vs actual

### Session
- `/forge:pause` — save HANDOFF and stop
- `/forge:resume` — restore from HANDOFF
- `/forge:progress` — smart next-action router
- `/forge:handoff` — detailed session handoff
- `/forge:dashboard` — single-screen project state view

### Milestones & Phases
- `/forge:milestone` — define a milestone
- `/forge:complete-milestone` — finalize a milestone
- `/forge:discuss-milestone` — explore milestone vision
- `/forge:add-phase` — add a phase
- `/forge:remove-phase` — remove a future phase

### Pre-Planning
- `/forge:discuss` — explore phase vision
- `/forge:assumptions` — surface assumptions
- `/forge:discover` — research technical options
- `/forge:research` — deep research with subagents
- `/forge:research-phase` — research unknowns for a phase

### Quality
- `/forge:verify` — UAT guidance
- `/forge:audit` — enterprise architectural audit
- `/forge:plan-fix` — plan fixes for UAT issues
- `/forge:consider-issues` — triage deferred issues
- `/forge:test` — pluggable test tier execution (brainstorm, configure, run, report)
- `/forge:debug` — persistent investigation workflow

### Specialized
- `/forge:flows` — configure skill integrations
- `/forge:config` — manage project configuration
- `/forge:map-codebase` — generate codebase analysis
- `/forge:retrofit` — initialize FORGE from existing git history
- `/forge:register` — generate forge.json for legacy projects

## CARL Rules

Rules are enforced via `src/carl/FORGE` manifest. Key rules:
- RULE_1: Load command files before executing (never from memory)
- RULE_2: No implementation without approved PLAN.md
- RULE_3: Every APPLY must be followed by UNIFY
- RULE_7: Tasks require `<verify>` criteria

## File Structure

```
src/
  commands/     — slash command definitions (32 commands)
  workflows/    — execution playbooks
  references/   — shared knowledge docs
  templates/    — file templates for .forge/ state
  rules/        — invariant definitions
  carl/         — CARL rule manifest
```
