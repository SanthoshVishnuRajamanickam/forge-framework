---
name: forge:discuss
description: Explore and articulate phase vision before planning
argument-hint: "<phase-number>"
allowed-tools: [Read, Write, AskUserQuestion]
---

<objective>
Facilitate vision discussion for a specific phase and create context handoff.

**When to use:** Before planning a phase, when goals and approach need exploration.
</objective>

<execution_context>
@~/.claude/forge-framework/workflows/discuss-phase.md
</execution_context>

<context>
Phase number: $ARGUMENTS (required)

@.forge/PROJECT.md
@.forge/STATE.md
@.forge/ROADMAP.md
</context>

<process>
Follow workflow: @~/.claude/forge-framework/workflows/discuss-phase.md
</process>

<success_criteria>
- [ ] CONTEXT.md created in phase directory
- [ ] Goals and approach articulated
- [ ] Ready for /forge:plan command
</success_criteria>
