---
name: forge:test
description: Run test tiers ad-hoc or configure test profile
argument-hint: "[tier] or [configure]"
allowed-tools: [Read, Write, Bash, Glob, Grep, Task]
---

<objective>
Run test tiers on-demand outside the normal loop, or configure the project's test profile.

**Subcommands:**
- `(no argument)`: Run all enabled tiers for current phase
- `static` / `unit` / `integration` / `e2e` / `mcp` / `visual` / `performance` / `security` / `platform` / `manual`: Run specific tier
- `brainstorm`: Guided exploration of what to test and how — run before configure
- `configure`: Interactive test profile setup
- `report`: Show latest TEST-REPORT.md
</objective>

<execution_context>
@src/workflows/test-strategy.md
@src/references/test-flows.md
</execution_context>

<process>

**If argument = "brainstorm":**
Follow the brainstorm workflow: @src/workflows/test-brainstorm.md

---

**If argument = "configure":**
1. Read `.forge/SPECIAL-FLOWS.md` (or offer to create)
2. Detect project tech stack:
   ```bash
   ls package.json Cargo.toml pyproject.toml CMakeLists.txt build.gradle 2>/dev/null
   ```
3. For each tier, ask:
   - "Enable {tier} tests? [y/n]"
   - If yes: "Executor type? [1] CLI command [2] Skill [3] MCP server [4] Manual"
   - Collect executor-specific config (command, skill name, MCP server, etc.)
4. Write test_profile to SPECIAL-FLOWS.md
5. Display summary

**If argument = tier name:**
1. Load test profile from SPECIAL-FLOWS.md
2. Invoke test-strategy workflow with the specified tier
3. Display results

**If no argument:**
1. Load test profile
2. Run all enabled tiers in order: static → unit → integration → e2e → mcp → visual → performance → security → platform → manual
3. Generate TEST-REPORT.md
4. Display summary with routing for failures

**If argument = "report":**
1. Find latest TEST-REPORT.md in .forge/phases/
2. Display contents

</process>

<success_criteria>
- [ ] Test profile loaded or configured
- [ ] Specified tier(s) executed
- [ ] Results displayed with pass/fail per executor
- [ ] Failures routed to /forge:plan-fix or /forge:debug
</success_criteria>
