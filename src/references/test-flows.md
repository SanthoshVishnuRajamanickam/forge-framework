<overview>
Test flow architecture for FORGE. Every project declares a **test profile** — a set of
test tiers, each bound to a pluggable **executor**. FORGE orchestrates when tests run
(per-task, per-checkpoint, per-phase, per-milestone) and reads results. It never
assumes *how* tests run — that's the executor's job.
</overview>

<design_principles>

1. **Tiers are slots, not implementations.** A tier is *when* and *why* you test.
   The executor is *how*. They're configured independently.
2. **Executors are pluggable.** A skill, MCP server, CLI command, or manual checklist
   can fill any tier. Mix and match per project.
3. **Evidence over trust.** Every executor must produce a result FORGE can read:
   pass/fail, output text, optional artifacts (screenshots, logs, coverage reports).
4. **Progressive confidence.** Fast tests run often (per-task). Slow tests run at gates
   (per-checkpoint, per-phase). Full suites run at milestones.

</design_principles>

<test_tiers>

## Tier Definitions

| Tier | Scope | When | Gate Level |
|------|-------|------|------------|
| **static** | Linting, MISRA, type-check, SAST | Pre-unit (earliest gate) | Task completion |
| **unit** | Single function/module | Per-task during APPLY | Task completion |
| **integration** | Cross-module, service boundaries, DB | Per-plan checkpoint | Checkpoint |
| **e2e** | Full user journey, browser/app | VERIFY phase | Phase completion |
| **mcp-driven** | AI tests via MCP tools (no scripts) | VERIFY phase or on-demand | Phase completion |
| **visual** | Screenshot diff, snapshot, golden image | VERIFY phase | Phase completion |
| **performance** | Load, latency, Lighthouse, timing | VERIFY or checkpoint | Phase completion |
| **security** | SAST, DAST, dep scan, secrets scan | VERIFY phase | Phase completion |
| **platform** | Multi-device, hardware, cross-system | Per-milestone or on-demand | Milestone completion |
| **manual** | Human-guided exploratory/accessibility | VERIFY phase | Phase completion |

The **platform** tier is the catch-all for anything that tests across system boundaries.
The *executor* determines what kind of platform testing happens:

| Platform executor | Domain | Example tools |
|-------------------|--------|---------------|
| Playwright MCP | Web browsers | navigate, click, screenshot |
| PSIX MCP | Qt applications | send_signal, read_state, screenshot |
| dSPACE MCP | HIL / hardware-in-loop | load_model, inject_signal, verify_timing |
| Appium / Detox | Mobile apps | tap, swipe, type, screenshot |
| Custom MCP | Your domain | whatever your MCP server exposes |
| CLI harness | Any | shell scripts orchestrating multiple targets |

A project can bind multiple platform executors for cross-device coordination
(e.g. PSIX for Qt + Appium for Android + dSPACE for HIL — all in one tier).

Projects only enable the tiers they need. A CLI tool might only use `unit` + `integration`.
A Qt+Android+HIL system might use all six with multiple platform executors.

</test_tiers>

<executor_types>

## Executor Types

An executor is anything that can run tests and return results. Four types:

### 1. CLI Command (`type: cli`)

Traditional test runner invoked via shell command. FORGE runs it, reads stdout/stderr,
parses exit code.

```yaml
executor:
  type: cli
  command: "npm test"
  coverage_command: "npm run coverage"    # optional
  coverage_min: 80                        # optional, blocks below threshold
  parse_format: auto                      # auto | tap | junit | json | exit-code
```

Examples: `pytest`, `npm test`, `go test ./...`, `ctest`, `./gradlew test`

### 2. Skill (`type: skill`)

A Claude Code slash command skill. FORGE invokes the skill, which handles execution
and returns structured results.

```yaml
executor:
  type: skill
  skill: "/playwright-cli"                # skill name to invoke
  args_template: "test {{test_scope}}"    # args pattern, variables from plan context
  evidence: screenshots                   # screenshots | logs | report | none
```

Examples: `/playwright-cli`, `/frontend-design test`, custom project skills

### 3. MCP Server (`type: mcp`)

An MCP server that exposes testing tools. FORGE uses the MCP tools directly —
no scripts, no skill wrapper. The AI reads acceptance criteria and drives the tools.

```yaml
executor:
  type: mcp
  server: "playwright"                    # MCP server name from settings
  tools:                                  # which MCP tools to use
    - browser_navigate
    - browser_snapshot
    - browser_click
    - browser_fill_form
    - browser_take_screenshot
  strategy: ac-driven                     # ac-driven | scripted | exploratory
  evidence: screenshots                   # what to capture
```

Examples:
- `playwright` MCP — browser E2E testing
- `psix` MCP — Qt application testing via PSIX protocol
- `dspace` MCP — HIL testing via dSPACE hardware interface
- Any custom MCP server that exposes test-relevant tools

### 4. Manual (`type: manual`)

Human-executed testing. FORGE generates a checklist from acceptance criteria,
the human executes and reports results.

```yaml
executor:
  type: manual
  generate_checklist: true                # auto-generate from AC
  evidence: user-report                   # user types pass/fail per item
  categories:                             # optional focus areas
    - exploratory
    - accessibility
    - edge-cases
    - device-matrix
  device_matrix:                          # optional for cross-device
    - "desktop-linux"
    - "pixel-7"
    - "samsung-s24"
```

</executor_types>

<executor_extensions>

## Executor Extensions

These fields are **optional** and apply to any executor type. They address cross-domain
needs surfaced by embedded, mobile, web, and QA requirements.

### Lifecycle Hooks

Every executor can define pre/post hooks. Hooks run shell commands before the executor
starts and after it finishes — regardless of pass/fail.

```yaml
executor:
  type: cli
  command: "npm test"
  hooks:
    pre_test:                             # runs before executor
      - "docker compose up -d test-db"    # start test database
      - "npm run db:migrate"              # run migrations
      - "npm run db:seed"                 # seed test data
    post_test:                            # runs after executor (always)
      - "docker compose down"             # teardown
    pre_build:                            # build before test (embedded/mobile)
      - "cmake --build build/"            # compile firmware
    pre_flash:                            # flash to target (embedded)
      - "openocd -f board.cfg -c 'program build/fw.elf verify reset exit'"
    pre_distribute:                       # distribute app (mobile)
      - "fastlane beta"                   # push to TestFlight/Firebase
```

Hooks are plain shell commands. FORGE runs them sequentially; any non-zero exit
blocks the executor from starting and reports an infrastructure failure (not a test failure).

### Execution Target

Where the executor runs. Critical for cross-compilation and device testing.

```yaml
executor:
  target: host                            # default
  # host         — local machine (x86/ARM, whatever you're on)
  # simulator    — QEMU, Renode, iOS Simulator, Android Emulator
  # device       — real hardware (USB, network, JTAG)
  # cloud-farm   — BrowserStack, Firebase Test Lab, AWS Device Farm
  #
  # For cloud-farm, additional config:
  cloud:
    provider: firebase-test-lab           # firebase-test-lab | browserstack | aws-device-farm
    device_pool: "Pixel 7, Samsung S24"   # provider-specific device selection
    api_key_env: "FIREBASE_TEST_LAB_KEY"  # env var with API key (never hardcoded)
```

### Environment Context

Tests may behave differently per environment. Pass context to executors.

```yaml
executor:
  environment: staging                    # dev | staging | production | custom
  env_vars:                               # injected as env vars before executor runs
    API_URL: "https://staging.example.com"
    DB_URL: "postgresql://test@localhost/testdb"
```

### Timing Assertions (embedded / performance)

For executors that verify real-time constraints.

```yaml
executor:
  timing_assertions:
    - metric: "gpio_toggle_latency"
      threshold_ms: 0.1                   # 100 microseconds
      tolerance_pct: 10                   # 10% tolerance
    - metric: "api_response_p95"
      threshold_ms: 200
```

### Parallel Execution

For large test suites that need sharding.

```yaml
executor:
  parallel:
    shards: 4                             # split into N shards
    strategy: round-robin                 # round-robin | by-file | by-duration
    # CLI example: "npx vitest run --shard={{shard_index}}/{{shard_count}}"
```

### Network Conditioning (mobile / distributed)

Simulate adverse network conditions during test execution.

```yaml
executor:
  network:
    condition: slow-3g                    # none | slow-3g | offline | lossy | custom
    # For custom:
    latency_ms: 300
    packet_loss_pct: 5
    bandwidth_kbps: 500
```

### Build Variant (mobile)

Target specific build configurations.

```yaml
executor:
  build_variant: debug                    # debug | release | custom
  flavor: free                            # app flavor (Android product flavors, iOS schemes)
```

</executor_extensions>

<failure_taxonomy>

## Failure Taxonomy

When a test fails, FORGE classifies the failure before routing. This prevents
code bugs from being confused with environment issues or flaky tests.

### Categories

| Category | Signal | Route to | Example |
|----------|--------|----------|---------|
| **code_bug** | Test logic failed, assertion mismatch | `/forge:plan-fix` | Expected 200, got 500 |
| **environment** | Executor setup failed, service unreachable | Re-run or fix infra | DB connection refused |
| **infrastructure** | MCP server crashed, executor timeout, OOM | Retry + alert | Playwright MCP unresponsive |
| **flaky** | Passed on retry, non-deterministic | Quarantine list | Race condition in async test |
| **test_debt** | Test itself is wrong/outdated | Update test | Snapshot outdated after UI change |
| **config** | Wrong env vars, missing secrets, bad paths | Fix config | API_URL points to wrong env |

### Classification Flow

```
Test fails
  → Was it a hook failure (pre_test, pre_build, pre_flash)?
    → YES → category: environment or infrastructure
  → Retry once (automatic for all tiers)
    → Passes on retry?
      → YES → category: flaky → add to .forge/flaky-tests.md
      → NO → continue classification
  → Did the executor itself crash (non-test error)?
    → YES → category: infrastructure
  → Is the assertion about app behavior?
    → YES → category: code_bug → route to /forge:plan-fix
  → Is the assertion about test expectations (snapshot, golden)?
    → YES → category: test_debt → flag for test maintenance
  → Default → category: code_bug
```

### Flaky Test Quarantine

Flaky tests are tracked in `.forge/flaky-tests.md`:

```markdown
| Test | Tier | Executor | First Seen | Occurrences | Status |
|------|------|----------|------------|-------------|--------|
| auth.test.ts:47 | unit | Vitest | 2026-04-01 | 3 | quarantined |
```

Quarantined tests:
- Still run but don't gate (warning, not blocker)
- Count toward a "flaky budget" — if >5% of tests are flaky, that's a blocker
- Must be resolved before milestone completion

</failure_taxonomy>

<test_data_management>

## Test Data Management

Tests need data. FORGE doesn't prescribe how — it provides slots for the project
to declare its strategy.

### Configuration

```yaml
test_data:
  strategy: fixtures                      # fixtures | factories | seeds | snapshots | none
  setup_command: "npm run db:seed"        # run before integration/e2e tiers
  teardown_command: "npm run db:reset"    # run after integration/e2e tiers
  fixtures_path: "tests/fixtures/"        # where fixture files live
  snapshot_command: "pg_dump testdb > fixtures/snapshot.sql"  # for DB snapshot strategy
```

### Strategies

| Strategy | Best for | How it works |
|----------|----------|-------------|
| **fixtures** | Small/medium projects | Static JSON/SQL files loaded before tests |
| **factories** | Large projects, dynamic data | Code generates test data on-the-fly (Faker, Factory Bot) |
| **seeds** | Database-heavy apps | Seed script populates DB with known state |
| **snapshots** | Complex state | Dump/restore database snapshots per test suite |
| **none** | Pure unit tests | No external data needed |

### Integration with Lifecycle Hooks

Test data commands are sugar over lifecycle hooks. These are equivalent:

```yaml
# Explicit test_data config
test_data:
  setup_command: "npm run db:seed"
  teardown_command: "npm run db:reset"

# Equivalent hooks on each executor
executor:
  hooks:
    pre_test: ["npm run db:seed"]
    post_test: ["npm run db:reset"]
```

The `test_data` top-level config applies globally; per-executor hooks override.

</test_data_management>

<safety_traceability>

## Safety Traceability (Regulated Projects)

For projects under ISO 26262, DO-178C, IEC 61508, or similar standards.
Optional — only configure if your project requires certification.

### Configuration

```yaml
safety:
  enabled: true
  standard: iso-26262                     # iso-26262 | do-178c | iec-61508 | custom
  asil_level: ASIL-B                      # ASIL-A/B/C/D (ISO 26262) or DAL-A..E (DO-178C)
  coverage_requirements:
    statement: 100                        # % statement coverage required
    branch: 100                           # % branch coverage required
    mcdc: true                            # MC/DC coverage required (ASIL-C/D, DAL-A/B)
  traceability: true                      # require requirement→test→evidence links
```

### Traceability Matrix

When `safety.traceability` is enabled, every test must link to a requirement.
The TEST-REPORT.md includes a traceability section:

```markdown
## Traceability Matrix

| Requirement ID | Test ID | Tier | Result | Evidence | Tool Version |
|---------------|---------|------|--------|----------|-------------|
| REQ-042 | unit/auth.test.ts:47 | unit | PASS | hash:a1b2c3 | vitest@2.1.0 |
| REQ-043 | platform/gpio.test | platform | PASS | timing_log.csv | ctest@3.28 |

Coverage: 42/45 requirements covered (93.3%)
Uncovered: REQ-012, REQ-038, REQ-044
```

### MC/DC Coverage Reporting

When `safety.coverage_requirements.mcdc` is enabled, the coverage section expands:

```markdown
## Coverage (ISO 26262 ASIL-B)

| Module | Statement | Branch | MC/DC | Required | Status |
|--------|-----------|--------|-------|----------|--------|
| src/ecu/safety.c | 100% | 100% | 98% | 100% MC/DC | GAP |
| src/ecu/comms.c | 100% | 100% | 100% | 100% MC/DC | PASS |
```

MC/DC tools: gcov + mcdc-analyzer, Polyspace, LDRA, VectorCAST.

</safety_traceability>

<test_profile>

## Test Profile Configuration

The test profile lives in `.forge/SPECIAL-FLOWS.md` under a `## Test Flows` section,
or in `.forge/config.md` as structured YAML. It declares which tiers are active and
what executor fills each slot.

### Full Example: Qt + Android Cross-Platform Project

```yaml
test_profile:
  unit:
    enabled: true
    executors:
      - name: "Qt unit tests"
        type: cli
        command: "ctest --test-dir build --output-on-failure"
        coverage_min: 75
      - name: "Android unit tests"
        type: cli
        command: "./gradlew testDebugUnitTest"
        coverage_min: 70

  integration:
    enabled: true
    executors:
      - name: "Protocol integration"
        type: cli
        command: "pytest tests/integration/ -v"
      - name: "PSIX Qt integration"
        type: mcp
        server: "psix"
        tools: [psix_send_signal, psix_read_state, psix_verify_transition]
        strategy: ac-driven

  e2e:
    enabled: true
    executors:
      - name: "Qt E2E"
        type: mcp
        server: "psix"
        tools: [psix_launch_app, psix_navigate, psix_screenshot, psix_verify_screen]
        strategy: ac-driven
        evidence: screenshots
      - name: "Android E2E"
        type: cli
        command: "./gradlew connectedAndroidTest"

  platform:
    enabled: true
    executors:
      - name: "Qt desktop via PSIX"
        type: mcp
        server: "psix"
        tools: [psix_launch_app, psix_navigate, psix_screenshot, psix_verify_screen]
        strategy: ac-driven
        evidence: screenshots
      - name: "Android via Appium"
        type: cli
        command: "./gradlew connectedAndroidTest"
      - name: "Device sync (Bluetooth)"
        type: mcp
        server: "psix"
        tools: [psix_launch_app, psix_bluetooth_pair, psix_verify_sync]
        strategy: scripted
        evidence: logs
      - name: "dSPACE HIL"
        type: mcp
        server: "dspace"
        tools: [dspace_load_model, dspace_inject_signal, dspace_read_output, dspace_verify_timing]
        strategy: ac-driven
        evidence: logs

  manual:
    enabled: true
    executors:
      - name: "Device matrix testing"
        type: manual
        generate_checklist: true
        device_matrix: ["desktop-linux", "pixel-7", "samsung-s24"]
        categories: [exploratory, accessibility]
```

### Minimal Example: Node.js API

```yaml
test_profile:
  unit:
    enabled: true
    executors:
      - name: "Vitest"
        type: cli
        command: "npx vitest run"
        coverage_command: "npx vitest run --coverage"
        coverage_min: 80

  integration:
    enabled: true
    executors:
      - name: "API integration"
        type: cli
        command: "npx vitest run tests/integration/"

  e2e:
    enabled: true
    executors:
      - name: "Playwright"
        type: mcp
        server: "playwright"
        tools: [browser_navigate, browser_snapshot, browser_click, browser_fill_form, browser_take_screenshot]
        strategy: ac-driven
        evidence: screenshots
```

### Web App with Custom Skill

```yaml
test_profile:
  unit:
    enabled: true
    executors:
      - name: "Jest"
        type: cli
        command: "npm test"

  e2e:
    enabled: true
    executors:
      - name: "Playwright CLI skill"
        type: skill
        skill: "/playwright-cli"
        args_template: "test --headed {{test_scope}}"
        evidence: screenshots
```

</test_profile>

<orchestration>

## When Tests Run (Orchestration Rules)

### During APPLY (per-task)

```
Task completed
  → Has static tier enabled?
    → Run static analysis executors (lint, MISRA, type-check)
    → ANY failure → task stays incomplete
  → Has unit tier enabled?
    → Run all unit executors
    → ANY failure → task stays incomplete (RULE_7)
    → ALL pass → task qualifies
  → Classify any failures via failure taxonomy before routing
```

### At Checkpoints (per-plan)

```
Checkpoint reached
  → Has integration tier enabled?
    → Run all integration executors
    → ANY failure → checkpoint blocks
    → ALL pass → checkpoint clears
```

### During VERIFY (per-phase)

```
/forge:verify invoked
  → Run tiers in order: e2e → mcp-driven → visual → performance → security → manual
  → Each tier's executors run in declared order
  → Lifecycle hooks fire: pre_test → executor → post_test
  → Classify failures via taxonomy (code_bug / environment / flaky / etc.)
  → Collect evidence (screenshots, logs, reports, timing data)
  → Generate test evidence report at .forge/phases/{phase}/TEST-REPORT.md
  → Failures route based on category:
      code_bug → /forge:plan-fix
      environment/infrastructure → retry or fix config
      flaky → quarantine + warning
      test_debt → flag for maintenance
```

### At Milestone Completion

```
/forge:complete-milestone invoked
  → Has platform tier enabled?
    → Run all platform executors (PSIX, dSPACE, Appium, etc.)
    → Results gate milestone completion
  → Full regression: re-run all enabled tiers
  → Milestone TEST-REPORT.md generated
```

</orchestration>

<mcp_driven_testing>

## MCP-Driven Testing Deep Dive

MCP-driven testing is the most powerful mode — the AI *becomes* the tester.

### How It Works

1. **Plan-time:** FORGE reads acceptance criteria from PLAN.md
2. **Verify-time:** FORGE translates each AC into an MCP test sequence:
   - Given [precondition] → set up app state via MCP tools
   - When [action] → perform action via MCP tools
   - Then [outcome] → verify state via MCP tools + screenshot
3. **Evidence:** Each AC produces a pass/fail with screenshot/log evidence
4. **Report:** Structured TEST-REPORT.md with linked artifacts

### Strategies

| Strategy | How AI uses MCP tools | Best for |
|----------|----------------------|----------|
| `ac-driven` | AI reads Given/When/Then from AC, translates to MCP calls | Structured features |
| `scripted` | AI follows a predefined sequence of MCP calls | Regression suites |
| `exploratory` | AI explores the app freely, reports anomalies | Edge case discovery |

### Example: MCP-Driven E2E Test Flow

```
AC: Given a logged-in user
    When they click "Create Project"
    Then a modal appears with name/description fields

MCP execution:
  1. browser_navigate → /login
  2. browser_fill_form → email + password
  3. browser_click → "Sign In"
  4. browser_take_screenshot → evidence_01_logged_in.png
  5. browser_click → "Create Project"
  6. browser_snapshot → check for modal element
  7. browser_take_screenshot → evidence_02_modal.png
  8. PASS: modal found with name + description fields
```

### Custom MCP Servers for Domain Testing

The architecture supports ANY MCP server. Examples:

| MCP Server | Domain | Tools it exposes |
|-----------|--------|-----------------|
| `playwright` | Web browser | navigate, click, fill, screenshot, snapshot |
| `psix` | Qt applications | launch, navigate, send_signal, read_state, screenshot |
| `dspace` | HIL hardware | load_model, inject_signal, read_output, verify_timing |
| `appium-mcp` | Mobile apps | tap, swipe, type, screenshot, element_find |
| Custom | Your domain | Whatever tools your MCP server exposes |

All of these are **platform executors**. They plug into whichever tier fits:
- `playwright` often fills the `e2e` tier for web apps
- `psix` + `dspace` together fill the `platform` tier for automotive/embedded
- Any MCP server can fill any tier — it's configuration, not code

To add a new MCP test executor, you only need:
1. An MCP server running and configured in Claude Code settings
2. A test_profile entry mapping the server's tools to a tier

No FORGE code changes required — it's configuration, not implementation.

</mcp_driven_testing>

<test_report_format>

## Test Report Format

Generated at `.forge/phases/{phase}/TEST-REPORT.md` during VERIFY.

```markdown
# Test Report: Phase {N} — {Phase Name}

**Generated:** {timestamp}
**Plan:** {plan-path}
**Profile:** {tiers-run}

## Summary

| Tier | Executor | Pass | Fail | Skip | Duration |
|------|----------|------|------|------|----------|
| unit | Vitest | 42 | 0 | 2 | 3.2s |
| integration | API tests | 12 | 1 | 0 | 8.7s |
| e2e | Playwright MCP | 5 | 0 | 0 | 24.1s |

## Failures

### integration / API tests
- `POST /auth/register duplicate email` — Expected 409, got 500
  - **File:** tests/integration/auth.test.ts:47
  - **Impact:** Blocks AC-3 (duplicate user handling)

## Evidence

- [evidence_01_login.png](./evidence/evidence_01_login.png)
- [evidence_02_dashboard.png](./evidence/evidence_02_dashboard.png)

## Coverage

| Module | Line % | Branch % | Threshold | Status |
|--------|--------|----------|-----------|--------|
| src/api | 87% | 72% | 80% | PASS |
| src/auth | 64% | 51% | 80% | FAIL |

## Routing

Failures detected → suggested action:
- `/forge:plan-fix` for integration failure (AC-3 regression)
- `/forge:debug "auth coverage below threshold"` for coverage gap
```

</test_report_format>
