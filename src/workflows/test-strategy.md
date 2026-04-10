<purpose>
Orchestrate test execution across the FORGE loop based on the project's test profile.
This workflow is invoked automatically by apply-phase (per-task, per-checkpoint) and
verify-work (per-phase), and by complete-milestone (per-milestone). It reads the test
profile from SPECIAL-FLOWS.md, resolves executor bindings, runs the appropriate tier,
and returns structured results.

Not a user-facing command — it's infrastructure called by other workflows.
</purpose>

<when_to_use>
- Called by apply-phase after task completion (unit tier)
- Called by apply-phase at checkpoints (integration tier)
- Called by verify-work during VERIFY phase (e2e, mcp-driven, manual tiers)
- Called by complete-milestone (platform tier)
- Called directly via /forge:test for ad-hoc runs
</when_to_use>

<required_reading>
@.forge/SPECIAL-FLOWS.md (test_profile section)
@.forge/config.md (test overrides if any)
@~/.claude/forge-framework/references/test-flows.md
</required_reading>

<process>

<step name="load_test_profile" priority="first">
1. Read `.forge/SPECIAL-FLOWS.md`
2. Parse the `test_profile:` YAML block
3. If no test_profile exists:
   - Check if project has detectable test infrastructure:
     ```bash
     ls package.json Cargo.toml pyproject.toml CMakeLists.txt build.gradle 2>/dev/null
     ```
   - If package.json exists: check for `test` script in `scripts`
   - Offer to auto-configure: "No test profile found. Auto-detect? [1] Yes [2] Skip"
   - If auto-detect: infer framework from project files, create minimal profile
   - If skip: return `{ status: "skipped", reason: "no test profile" }`
4. Store parsed profile as `test_profile`
</step>

<step name="resolve_tier">
**Called with a `tier` parameter (static | unit | integration | e2e | mcp-driven | visual | performance | security | platform | manual)**

1. Look up `test_profile.{tier}`
2. If tier not enabled or not defined: return `{ status: "skipped", reason: "tier not enabled" }`
3. Collect all executors for this tier
4. For each executor, validate its type and required config:
   - `cli`: command must be non-empty
   - `skill`: skill name must be non-empty
   - `mcp`: server must be named, tools list non-empty
   - `manual`: generate_checklist must be true or categories non-empty
5. Validate optional extensions if present:
   - `target`: must be one of host | simulator | device | cloud-farm
   - `hooks`: pre_test/post_test must be string arrays
   - `environment`: inject env_vars into executor process
6. Return list of validated executors
</step>

<step name="execute_cli">
**For executor type: cli**

1. Run lifecycle hooks (if defined):
   - `hooks.pre_build` → compile/build (embedded/mobile)
   - `hooks.pre_flash` → flash firmware to target (embedded)
   - `hooks.pre_distribute` → distribute app (mobile)
   - `hooks.pre_test` → setup (start server, seed DB, etc.)
   - Any hook failure → return `{ status: "fail", category: "environment", message: "hook failed" }`
2. If `network.condition` defined: apply network conditioning
3. Run the command:
   ```bash
   {{executor.command}}
   ```
4. Capture exit code, stdout, stderr
3. Parse results based on `parse_format`:
   - `auto`: infer from output (TAP, JUnit XML, JSON, or plain exit code)
   - `tap`/`junit`/`json`: parse structured output
   - `exit-code`: 0 = pass, non-zero = fail
4. If `coverage_command` defined and this is a tier-completion run:
   ```bash
   {{executor.coverage_command}}
   ```
   - Extract coverage percentage
   - Compare to `coverage_min`
   - Below threshold = FAIL with coverage report
5. Return:
   ```
   { executor: "name", type: "cli", status: "pass|fail",
     passed: N, failed: N, skipped: N, duration: "Xs",
     coverage: { line: N%, branch: N%, threshold: N%, met: bool },
     output: "raw output (truncated to 2000 chars)",
     failures: [{ test: "name", message: "error", file: "path:line" }] }
   ```
</step>

<step name="execute_skill">
**For executor type: skill**

1. Resolve args from plan context:
   - Replace `{{test_scope}}` with current phase/plan scope
   - Replace `{{plan_path}}` with active PLAN.md path
2. Invoke the skill:
   - Use the Skill tool with `skill: "{{executor.skill}}"` and `args: "{{resolved_args}}"`
3. Read skill output
4. Parse for pass/fail signals:
   - Look for structured output (JSON, TAP, or pass/fail counts)
   - Collect evidence artifacts (screenshots, logs)
5. Return structured result (same format as cli)
</step>

<step name="execute_mcp">
**For executor type: mcp**

This is the AI-as-tester mode. FORGE doesn't run a script — it becomes the tester.

1. Load acceptance criteria from the active PLAN.md `<acceptance_criteria>` section
2. Based on `strategy`:

   **ac-driven:**
   - For each AC (Given/When/Then):
     a. Translate "Given" into MCP setup calls (navigate, set state)
     b. Translate "When" into MCP action calls (click, fill, submit)
     c. Translate "Then" into MCP verification calls (snapshot, screenshot, assert)
     d. Capture evidence at each step
     e. Score: PASS if "Then" conditions met, FAIL otherwise

   **scripted:**
   - Follow the executor's `tools` list as a fixed sequence
   - Execute each tool in order with context-appropriate parameters
   - Capture evidence at each step

   **exploratory:**
   - Start at the app's entry point
   - Navigate freely, interacting with UI elements
   - Flag anomalies: broken layouts, error messages, unresponsive elements
   - Take screenshots of anything unexpected
   - Report findings as observations, not pass/fail

3. Generate evidence directory: `.forge/phases/{phase}/evidence/`
4. Return:
   ```
   { executor: "name", type: "mcp", strategy: "ac-driven",
     status: "pass|fail|observations",
     ac_results: [{ ac: "AC-1", status: "pass|fail", evidence: "path" }],
     screenshots: ["path1.png", "path2.png"],
     observations: ["finding 1", "finding 2"] }
   ```
</step>

<step name="execute_manual">
**For executor type: manual**

1. If `generate_checklist` is true:
   - Read acceptance criteria from PLAN.md
   - Convert each AC to a checklist item
   - Add category-specific items (accessibility, edge cases, etc.)

2. Present interactive checklist:
   ```
   ════════════════════════════════════════
   MANUAL TEST CHECKLIST
   ════════════════════════════════════════

   Phase: {N} — {Phase Name}
   Categories: {categories}

   Instructions: Test each item manually and report pass/fail.

   [ ] 1. {AC-1 as testable action}
   [ ] 2. {AC-2 as testable action}
   [ ] 3. {Exploratory: edge case scenario}
   [ ] 4. {Accessibility: keyboard navigation}
   ...

   Report results for each item:
   (Enter: "1 pass, 2 pass, 3 fail: description, 4 pass")
   ════════════════════════════════════════
   ```

3. If `device_matrix` specified, repeat checklist per device:
   ```
   Testing on: desktop-linux (1 of 3)
   ...
   Testing on: pixel-7 (2 of 3)
   ...
   ```

4. Collect user responses, build result
5. Return structured result with user-reported status per item
</step>

<step name="aggregate_results">
**Called after all executors for a tier complete.**

1. Collect all executor results
2. Run lifecycle cleanup: `hooks.post_test` for each executor (always, even on failure)
3. Classify each failure via the failure taxonomy:
   - Hook failure → `environment` or `infrastructure`
   - Retry once; pass on retry → `flaky` (add to `.forge/flaky-tests.md`)
   - Executor crash (MCP server died, OOM) → `infrastructure`
   - Assertion mismatch → `code_bug`
   - Snapshot/golden mismatch → `test_debt`
4. Aggregate:
   - Total pass/fail/skip across all executors
   - Overall tier status: PASS (all pass), PARTIAL (some fail), FAIL (all fail)
   - Failure breakdown by category
5. Route based on category:
   - `code_bug` → `/forge:plan-fix`
   - `environment` / `infrastructure` → retry or alert
   - `flaky` → quarantine (warning, not blocker unless >5% flaky budget)
   - `test_debt` → flag for maintenance
6. Return aggregated tier result
</step>

<step name="generate_test_report">
**Called during VERIFY and milestone completion.**

Creates `.forge/phases/{phase}/TEST-REPORT.md` using format from test-flows reference.

1. Collect results from all tiers run in this phase
2. Build summary table (tier / executor / pass / fail / skip / duration)
3. List all failures with detail
4. Link evidence artifacts
5. Include coverage data if available
6. Add routing suggestions for failures
7. Write TEST-REPORT.md
8. Display summary to user
</step>

</process>

<integration_hooks>

## How Other Workflows Call This

### apply-phase (per-task)
After task qualifies:
```
→ call test-strategy with tier="unit"
→ if FAIL: task stays incomplete, show failure detail
→ if PASS or SKIPPED: proceed to next task
```

### apply-phase (at checkpoint)
At checkpoint:
```
→ call test-strategy with tier="integration"
→ if FAIL: checkpoint blocks, show failure detail
→ if PASS or SKIPPED: checkpoint clears
```

### verify-work (VERIFY phase)
When /forge:verify runs:
```
→ call test-strategy with tier="e2e"
→ call test-strategy with tier="mcp-driven"
→ call test-strategy with tier="manual"
→ call generate_test_report
→ if any FAIL: route to /forge:plan-fix
→ if all PASS: phase ready for UNIFY
```

### complete-milestone
When /forge:complete-milestone runs:
```
→ call test-strategy with tier="platform"
→ re-run all enabled tiers (full regression)
→ call generate_test_report (milestone-level)
→ if any FAIL: milestone blocked
→ if all PASS: milestone completes
```

</integration_hooks>

<error_handling>

**Executor not found:**
- `cli`: command not found → report with install suggestion
- `skill`: skill not loaded → prompt user to invoke it
- `mcp`: server not in settings → show config instructions
- `manual`: always available

**Executor timeout:**
- CLI commands: 5-minute default, configurable per executor
- MCP tools: 30-second per call default
- Manual: no timeout (human-paced)

**Flaky tests:**
- If a test fails then passes on immediate retry, flag as "flaky"
- Include in report but don't block (configurable)
- Track flaky test count across phases for trend analysis

</error_handling>
