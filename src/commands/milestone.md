---
name: forge:milestone
description: Create a new milestone in the project
argument-hint: "[milestone-name]"
allowed-tools: [Read, Write, Edit, Bash, Glob, AskUserQuestion]
---

<objective>
Create a new milestone with defined scope and phases.

**When to use:** Starting a new milestone cycle after completing the previous one.
</objective>

<execution_context>
@~/.claude/forge-framework/workflows/create-milestone.md
</execution_context>

<context>
$ARGUMENTS

@.forge/PROJECT.md
@.forge/STATE.md
@.forge/ROADMAP.md
</context>

<process>
Follow workflow: @~/.claude/forge-framework/workflows/create-milestone.md
</process>

<success_criteria>
- [ ] Milestone created in MILESTONES.md
- [ ] ROADMAP.md updated with milestone grouping
- [ ] STATE.md reflects new milestone
</success_criteria>
