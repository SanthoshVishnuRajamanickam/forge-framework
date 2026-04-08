---
name: forge:register
description: Generate forge.json for an existing FORGE project that predates v1.1 satellite manifest support
argument-hint:
allowed-tools: [Read, Write, Bash]
---

<objective>
Generate `.forge/forge.json` for an existing project that has a `.forge/` directory but no satellite manifest.

**When to use:** Projects initialized before forge-framework v1.1 that are missing `forge.json`. Required for BASE satellite auto-detection to discover and register the project.
</objective>

<execution_context>
@~/.claude/forge-framework/workflows/register-manifest.md
</execution_context>

<context>
Current directory (check for .forge/ and existing forge.json)
</context>

<process>
Follow workflow: @~/.claude/forge-framework/workflows/register-manifest.md
</process>

<success_criteria>
- [ ] .forge/forge.json created with correct project name and current state
- [ ] User confirmed BASE will detect the project on next session start
</success_criteria>
