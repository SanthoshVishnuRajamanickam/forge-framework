---
name: forge:init
description: Initialize FORGE in a project with conversational setup
argument-hint:
allowed-tools: [Read, Write, Bash, Glob, AskUserQuestion]
---

<objective>
Initialize the `.forge/` structure in a project directory through conversational setup.

**When to use:** Starting a new project with FORGE, or adding FORGE to an existing codebase.

Creates PROJECT.md, STATE.md, and ROADMAP.md populated from conversation - user does not manually edit templates.
</objective>

<execution_context>
@~/.claude/forge-framework/workflows/init-project.md
@~/.claude/forge-framework/templates/PROJECT.md
@~/.claude/forge-framework/templates/STATE.md
@~/.claude/forge-framework/templates/ROADMAP.md
</execution_context>

<context>
Current directory state (check for existing .forge/)
</context>

<process>
**Follow workflow: @~/.claude/forge-framework/workflows/init-project.md**

The workflow implements conversational setup:

1. Check for existing .forge/ (route to resume if exists)
2. Create directory structure
3. Ask: "What's the core value this project delivers?"
4. Ask: "What are you building?"
5. Confirm project name (infer from directory)
6. Populate PROJECT.md, ROADMAP.md, STATE.md from answers
7. Display ONE next action: `/forge:plan`

**Key behaviors:**
- Ask ONE question at a time
- Wait for response before next question
- Populate files from answers (user doesn't edit templates)
- End with exactly ONE next action
- Build momentum into planning phase
</process>

<success_criteria>
- [ ] .forge/ directory created
- [ ] PROJECT.md populated with core value and description from conversation
- [ ] STATE.md initialized with correct loop position
- [ ] ROADMAP.md initialized (phases TBD until planning)
- [ ] User presented with ONE clear next action
</success_criteria>
