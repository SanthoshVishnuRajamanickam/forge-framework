---
name: forge:complete-milestone
description: Mark current milestone as complete
argument-hint: "[version]"
allowed-tools: [Read, Write, Edit, Bash, Glob]
---

<objective>
Complete the current milestone, archive it, and evolve PROJECT.md.

**When to use:** All phases in current milestone are complete and verified.
</objective>

<execution_context>
@~/.claude/forge-framework/workflows/complete-milestone.md
</execution_context>

<context>
$ARGUMENTS

@.forge/PROJECT.md
@.forge/STATE.md
@.forge/ROADMAP.md
@.forge/MILESTONES.md
</context>

<process>
Follow workflow: @~/.claude/forge-framework/workflows/complete-milestone.md
</process>

<success_criteria>
- [ ] Milestone archived with summary
- [ ] PROJECT.md evolved with learnings
- [ ] Git tag created for version
- [ ] STATE.md updated to reflect completion
</success_criteria>
