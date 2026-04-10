---
name: forge:discuss-milestone
description: Explore and articulate next milestone vision
argument-hint: "[milestone-name]"
allowed-tools: [Read, Write, AskUserQuestion]
---

<objective>
Facilitate vision discussion for the next milestone and create context handoff.

**When to use:** Before creating a new milestone, when scope needs exploration.
</objective>

<execution_context>
@~/.claude/forge-framework/workflows/discuss-milestone.md
</execution_context>

<context>
@.forge/PROJECT.md
@.forge/STATE.md
@.forge/ROADMAP.md
@.forge/MILESTONES.md
</context>

<process>
Follow workflow: @~/.claude/forge-framework/workflows/discuss-milestone.md
</process>

<success_criteria>
- [ ] MILESTONE-CONTEXT.md created with vision
- [ ] Key themes and goals articulated
- [ ] Ready for /forge:milestone command
</success_criteria>
