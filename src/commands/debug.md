---
name: forge:debug
description: Systematic debugging with persistent state that survives context resets
argument-hint: "[symptom or bug description]"
allowed-tools: [Read, Write, Edit, Bash, Glob, Grep, Task]
---

<objective>
Investigate and diagnose a bug systematically. Creates a persistent debug file in `.forge/debug/` that acts as the debugging brain — it survives context resets so investigation can resume mid-stream.
</objective>

<execution_context>
@src/workflows/debug.md
</execution_context>

<process>
**Follow workflow:** @src/workflows/debug.md

The workflow implements:
1. Gather symptoms from the user (expected vs actual, error messages, when it started)
2. Create `.forge/debug/{timestamp}-{slug}.md` with the current hypothesis and evidence
3. Investigate autonomously — the user reports, Claude investigates
4. Update the debug file continuously as hypotheses are confirmed or ruled out
5. Propose a fix once root cause is identified
6. Route the fix through `/forge:plan-fix` if it touches production code
</process>

<success_criteria>
- [ ] Debug file created in `.forge/debug/`
- [ ] Root cause identified with evidence
- [ ] Fix proposed or routed to plan-fix
- [ ] Debug file preserved for future reference
</success_criteria>
