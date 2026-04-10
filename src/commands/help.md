---
name: forge:help
description: Show available FORGE commands and usage guide
---

<objective>
Display the complete FORGE command reference.
</objective>

<execution_context>
Inline — this command outputs the reference content below directly. No workflow file.
</execution_context>

<output_rules>
Output ONLY the reference content below. Do NOT add:

- Project-specific analysis
- Git status or file context
- Next-step suggestions
- Any commentary beyond the reference
</output_rules>

<reference>
# FORGE Command Reference

**FORGE** (Plan-Apply-Unify Loop) is a structured AI-assisted development framework for Claude Code.

## The Loop

Every unit of work follows this cycle:

```
┌─────────────────────────────────────┐
│  PLAN ──▶ APPLY ──▶ UNIFY          │
│                                     │
│  Define    Execute    Reconcile     │
│  work      tasks      & close       │
└─────────────────────────────────────┘
```

**Never skip UNIFY.** Every plan needs a summary.

## Quick Start

1. `/forge:init` - Initialize FORGE in your project
2. `/forge:plan` - Create a plan for your work
3. `/forge:apply` - Execute the approved plan
4. `/forge:unify` - Close the loop with summary

## Commands Overview

| Category | Commands |
|----------|----------|
| Core Loop | init, plan, apply, unify, help, status |
| Session | pause, resume, progress, handoff |
| Roadmap | add-phase, remove-phase |
| Milestone | milestone, complete-milestone, discuss-milestone |
| Pre-Planning | discuss, assumptions, discover, consider-issues |
| Research | research, research-phase |
| Specialized | flows, config, map-codebase |
| Quality | verify, plan-fix, audit |

---

## Core Loop Commands

### `/forge:init`
Initialize FORGE in a project.

- Creates `.forge/` directory structure
- Creates PROJECT.md, STATE.md, ROADMAP.md
- Prompts for project context and phases
- Optionally configures integrations (SonarQube, etc.)

Usage: `/forge:init`

---

### `/forge:plan [phase]`
Enter PLAN phase - create an executable plan.

- Reads current state from STATE.md
- Creates PLAN.md with tasks, acceptance criteria, boundaries
- Populates skills section from SPECIAL-FLOWS.md (if configured)
- Updates loop position

Usage: `/forge:plan` (auto-detects next phase)
Usage: `/forge:plan 3` (specific phase)

---

### `/forge:apply [plan-path]`
Execute an approved PLAN.md file.

- **Blocks if required skills not loaded** (from SPECIAL-FLOWS.md)
- Validates plan exists and hasn't been executed
- Executes tasks sequentially
- Handles checkpoints (decision, human-verify, human-action)
- Reports completion and prompts for UNIFY

Usage: `/forge:apply`
Usage: `/forge:apply .forge/phases/01-foundation/01-01-PLAN.md`

---

### `/forge:unify [plan-path]`
Reconcile plan vs actual and close the loop.

- Creates SUMMARY.md documenting what was built
- Audits skill invocations (if SPECIAL-FLOWS.md configured)
- Records decisions made, deferred issues
- Updates STATE.md with loop closure
- **Required** - never skip this step

Usage: `/forge:unify`
Usage: `/forge:unify .forge/phases/01-foundation/01-01-PLAN.md`

---

### `/forge:help`
Show this command reference.

Usage: `/forge:help`

---

### `/forge:status` *(deprecated)*
> Use `/forge:progress` instead.

Shows current loop position. Deprecated in favor of `/forge:progress` which provides better routing.

---

## Session Commands

### `/forge:pause [reason]`
Create handoff file and prepare for session break.

- Creates HANDOFF.md with complete context
- Updates STATE.md session continuity section
- Designed for context limits or multi-session work

Usage: `/forge:pause`
Usage: `/forge:pause "switching to other project"`

---

### `/forge:resume [handoff-path]`
Restore context from handoff and continue work.

- Reads STATE.md and any HANDOFF files
- Determines current loop position
- Suggests exactly ONE next action
- Archives consumed handoffs

Usage: `/forge:resume`
Usage: `/forge:resume .forge/HANDOFF-context.md`

---

### `/forge:dashboard [--html]`
Single-screen view of entire project state.

- Milestones, phases, loop position with progress bars
- Test profile status (configured tiers, coverage, flaky count)
- Special flows and integration status
- Git health metrics (commits, contributors, uncommitted)
- Blockers, deferred issues, suggested next action
- `--html` generates interactive dashboard at `.forge/dashboard.html`

Usage: `/forge:dashboard`
Usage: `/forge:dashboard --html`

---

### `/forge:progress [context]`
Smart status with routing - suggests ONE next action.

- Shows milestone and phase progress visually
- Displays current loop position
- Suggests exactly ONE next action (prevents decision fatigue)
- Accepts optional context to tailor suggestion
- Warns about context limits

Usage: `/forge:progress`
Usage: `/forge:progress "I only have 30 minutes"`

---

### `/forge:handoff [context]`
Generate comprehensive session handoff document.

- Creates detailed handoff for complex session breaks
- Captures decisions, progress, blockers, next steps
- More thorough than `/forge:pause`

Usage: `/forge:handoff`
Usage: `/forge:handoff "phase10-audit"`

---

## Roadmap Commands

### `/forge:add-phase <description>`
Append a new phase to the roadmap.

- Adds phase to end of ROADMAP.md
- Updates phase numbering
- Records in STATE.md decisions

Usage: `/forge:add-phase "API Authentication Layer"`

---

### `/forge:remove-phase <number>`
Remove a future (not started) phase from roadmap.

- Cannot remove completed or in-progress phases
- Renumbers subsequent phases
- Updates ROADMAP.md

Usage: `/forge:remove-phase 5`

---

## Milestone Commands

### `/forge:milestone <name>`
Create a new milestone with phases.

- Guides through milestone definition
- Creates phase structure
- Updates ROADMAP.md with milestone grouping

Usage: `/forge:milestone "v2.0 API Redesign"`

---

### `/forge:complete-milestone [version]`
Archive milestone, tag, and reorganize roadmap.

- Verifies all phases complete
- Creates git tag (if configured)
- Archives milestone to MILESTONES.md
- Evolves PROJECT.md for next milestone

Usage: `/forge:complete-milestone`
Usage: `/forge:complete-milestone v0.3`

---

### `/forge:discuss-milestone`
Explore and articulate vision before starting a milestone.

- Conversational exploration of goals
- Creates milestone context document
- Prepares for `/forge:milestone`

Usage: `/forge:discuss-milestone`

---

## Pre-Planning Commands

### `/forge:discuss <phase>`
Articulate vision and explore approach before planning.

- Conversational discussion of phase goals
- Creates CONTEXT.md capturing vision
- Prepares for `/forge:plan`

Usage: `/forge:discuss 3`
Usage: `/forge:discuss "authentication layer"`

---

### `/forge:assumptions <phase>`
Surface Claude's assumptions about a phase before planning.

- Shows what Claude would do if given free rein
- Identifies gaps in understanding
- Prevents misaligned planning

Usage: `/forge:assumptions 3`

---

### `/forge:discover <topic>`
Research technical options before planning a phase.

- Explores codebase for relevant patterns
- Documents findings for planning reference
- Lightweight alternative to full research

Usage: `/forge:discover "authentication patterns"`

---

### `/forge:consider-issues [source]`
Review deferred issues with codebase context, triage and route.

- Reads deferred issues from STATE.md or specified source
- Analyzes with current codebase context
- Suggests routing: fix now, defer, or close

Usage: `/forge:consider-issues`

---

## Research Commands

### `/forge:research <topic>`
Deploy research agents for documentation/web search.

- Spawns subagents for parallel research
- Gathers external documentation
- Creates RESEARCH.md with findings
- Main session vets and reviews results

Usage: `/forge:research "JWT best practices 2026"`

---

### `/forge:research-phase <number>`
Research unknowns for a phase using subagents.

- Identifies unknowns in phase scope
- Deploys research agents
- Synthesizes findings for planning

Usage: `/forge:research-phase 4`

---

## Specialized Commands

### `/forge:flows`
Configure specialized workflow integrations.

- Creates/updates SPECIAL-FLOWS.md
- Defines required skills per work type
- Skills are enforced at APPLY time

Usage: `/forge:flows`

---

### `/forge:config`
View or modify FORGE configuration.

- Shows current config.md settings
- Allows toggling integrations
- Manages project-level settings

Usage: `/forge:config`

---

### `/forge:map-codebase`
Generate codebase map for context.

- Creates structured overview of project
- Identifies key files and patterns
- Useful for research and planning

Usage: `/forge:map-codebase`

---

### `/forge:debug [symptom]`
Systematic debugging with persistent state.

- Creates `.forge/debug/` file as investigation brain
- Survives context resets — investigation resumes mid-stream
- User reports symptoms; Claude investigates autonomously
- Routes fixes through `/forge:plan-fix` when ready

Usage: `/forge:debug "login returns 500 after deploy"`

---

### `/forge:retrofit [--mode=quick|standard|full]`
Initialize FORGE on an existing project by reverse-engineering git history.

- Discovers project identity from package metadata + git tags
- Detects workflow shape (standard, squash-merge, trunk-based)
- Spawns parallel agents: codebase map + git history analysis
- Reconstructs milestones, phases, and features from commit patterns
- Presents confidence-scored findings for approval before writing

Usage: `/forge:retrofit`                    — standard mode (default)
Usage: `/forge:retrofit --mode=full`        — full reconstruction with plans
Usage: `/forge:retrofit --resume`           — resume interrupted retrofit
Usage: `/forge:retrofit --refine=history`   — re-run history agent only

---

## Quality Commands

### `/forge:verify`
Guide manual user acceptance testing of recently built features.

- Generates verification checklist from SUMMARY.md
- Guides through manual testing
- Records verification results

Usage: `/forge:verify`

---

### `/forge:audit [plan-path]`
Run enterprise-grade architectural audit on a plan.

- Performs senior engineer + compliance review
- Auto-applies must-have and strongly-recommended findings to plan
- Creates AUDIT.md report in phase directory
- Optional: enabled via `enterprise_plan_audit` in config

Usage: `/forge:audit`
Usage: `/forge:audit .forge/phases/20-ai-schema/20-01-PLAN.md`

---

### `/forge:plan-fix`
Plan fixes for UAT issues from verify.

- Reads issues identified during verify
- Creates targeted fix plan
- Smaller scope than full phase plan

Usage: `/forge:plan-fix`

---

### `/forge:test [tier|configure|report]`
Run test tiers or configure the project's test profile.

- Pluggable executor architecture: CLI, skill, MCP server, or manual
- 10 tiers: static, unit, integration, e2e, mcp-driven, visual, performance, security, platform, manual
- Auto-runs during APPLY (unit per-task, integration at checkpoints)
- Generates TEST-REPORT.md with evidence during VERIFY

Usage: `/forge:test`                — run all enabled tiers
Usage: `/forge:test brainstorm`     — guided discovery of what to test and how
Usage: `/forge:test unit`           — run specific tier
Usage: `/forge:test configure`      — interactive test profile setup
Usage: `/forge:test report`         — show latest TEST-REPORT.md

---

## Files & Structure

```
.forge/
├── PROJECT.md           # Project context and value prop
├── ROADMAP.md           # Phase breakdown and milestones
├── STATE.md             # Loop position and session state
├── config.md            # Optional integrations config
├── SPECIAL-FLOWS.md     # Optional skill requirements
├── MILESTONES.md        # Completed milestone archive
└── phases/
    ├── 01-foundation/
    │   ├── 01-01-PLAN.md
    │   ├── 01-01-AUDIT.md    (if enterprise audit enabled)
    │   └── 01-01-SUMMARY.md
    └── 02-features/
        ├── 02-01-PLAN.md
        ├── 02-01-AUDIT.md    (if enterprise audit enabled)
        └── 02-01-SUMMARY.md
```

## PLAN.md Structure

```markdown
---
phase: 01-foundation
plan: 01
type: execute
autonomous: true
---

<objective>
Goal, Purpose, Output
</objective>

<context>
@-references to relevant files
</context>

<skills>
Required skills from SPECIAL-FLOWS.md
</skills>

<acceptance_criteria>
Given/When/Then format
</acceptance_criteria>

<tasks>
<task type="auto">...</task>
</tasks>

<boundaries>
DO NOT CHANGE, SCOPE LIMITS
</boundaries>

<verification>
Completion checks
</verification>
```

## Task Types

| Type | Use For |
|------|---------|
| `auto` | Fully autonomous execution |
| `checkpoint:decision` | Choices requiring human input |
| `checkpoint:human-verify` | Visual/functional verification |
| `checkpoint:human-action` | Manual steps (rare) |

## Common Workflows

**Starting a new project:**
```
/forge:init
/forge:plan
# Approve plan
/forge:apply
/forge:unify
```

**Enterprise workflow (with audit enabled):**
```
/forge:plan        # Create plan
/forge:audit       # Audit + auto-fix plan
# Approve audited plan
/forge:apply       # Execute
/forge:unify       # Close loop
```

**Checking where you are:**
```
/forge:progress   # State + ONE next action (recommended)
```

**Resuming work (new session):**
```
/forge:resume     # Restores context, suggests next action
```

**Pausing work (before break):**
```
/forge:pause      # Creates handoff, updates state
```

**Pre-planning exploration:**
```
/forge:discuss 3       # Articulate vision
/forge:assumptions 3   # See Claude's assumptions
/forge:research "topic"  # Gather external info
/forge:plan 3          # Now create the plan
```

**Managing roadmap:**
```
/forge:add-phase "New Feature"    # Add phase
/forge:remove-phase 5             # Remove future phase
/forge:milestone "v2.0"           # Create milestone
/forge:complete-milestone         # Archive milestone
```

## Key Principles

1. **Loop must complete** - PLAN -> APPLY -> UNIFY, no shortcuts
2. **Commands are thin** - Logic lives in workflows
3. **State is tracked** - STATE.md knows where you are
4. **Boundaries are real** - Respect DO NOT CHANGE sections
5. **Acceptance criteria first** - Define done before starting
6. **Skills are enforced** - Required skills block APPLY until loaded

## Getting Help

- Run `/forge:progress` to see where you are and what to do next
- Read `.forge/PROJECT.md` for project context
- Read `.forge/STATE.md` for current position
- Check `.forge/ROADMAP.md` for phase overview

---

*FORGE Framework v0.4+ | 32 commands | Last updated: 2026-04-10*
</reference>
