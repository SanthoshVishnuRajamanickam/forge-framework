# Specialized Flows

**Project:** {{project_name}}
**Created:** {{timestamp}}
**Last Updated:** {{timestamp}}

---

## Project-Level Dependencies

Skills and commands that apply to this project's work.

| Work Type | Skill/Command | Priority | When Required | Notes |
|-----------|---------------|----------|---------------|-------|
| {{work_type}} | {{/skill-name}} | required | {{trigger_condition}} | {{optional_notes}} |
| {{work_type}} | {{/skill-name}} | optional | {{trigger_condition}} | {{optional_notes}} |

**Priority Legend:**
- `required` - Gap documented if not invoked during UNIFY
- `optional` - Informational only, no gap logged

---

## Phase Overrides

Skills needed for specific phases beyond project-level defaults.

| Phase | Additional Skills | Notes |
|-------|-------------------|-------|
| {{phase_number}} | {{/skill:subcommand}} | {{why_needed}} |

---

## Templates & Assets

Reference templates, assets, or external resources for this project.

| Asset Type | Location | When Used |
|------------|----------|-----------|
| {{asset_type}} | {{path_or_url}} | {{trigger_condition}} |

---

## Test Flows

Test profile for this project. Each tier is a *slot* filled by one or more
pluggable executors (cli, skill, mcp, manual). FORGE orchestrates *when* each
tier runs; the executor handles *how*.

Reference: @references/test-flows.md

```yaml
test_profile:

  static:
    enabled: {{true|false}}
    executors:
      - name: "{{linter_name}}"
        type: cli
        command: "{{lint_command}}"      # eslint, pylint, clippy, MISRA checker, etc.

  unit:
    enabled: {{true|false}}
    executors:
      - name: "{{framework_name}}"
        type: cli                       # cli | skill | mcp | manual
        command: "{{test_command}}"      # for type: cli
        coverage_command: "{{coverage}}" # optional
        coverage_min: {{threshold}}      # optional, blocks below %

  integration:
    enabled: {{true|false}}
    executors:
      - name: "{{name}}"
        type: {{cli|skill|mcp}}
        # ... executor-specific config (see test-flows.md)

  e2e:
    enabled: {{true|false}}
    executors:
      - name: "{{name}}"
        type: {{cli|skill|mcp}}
        # For MCP-driven:
        # server: "playwright"
        # tools: [browser_navigate, browser_click, browser_snapshot, browser_take_screenshot]
        # strategy: ac-driven           # ac-driven | scripted | exploratory
        # evidence: screenshots

  mcp_driven:
    enabled: {{true|false}}
    executors:
      - name: "{{name}}"
        type: mcp
        server: "{{mcp_server_name}}"
        tools: [{{tool1}}, {{tool2}}]
        strategy: {{ac-driven|scripted|exploratory}}
        evidence: {{screenshots|logs|report}}

  platform:
    enabled: {{true|false}}
    executors:
      # Bind as many platform executors as needed — each is a different
      # system/device/hardware target. Examples:
      # - PSIX MCP for Qt desktop apps
      # - dSPACE MCP for HIL hardware-in-loop
      # - Appium for mobile devices
      # - Custom MCP for your domain
      - name: "{{name}}"
        type: {{cli|mcp}}
        server: "{{mcp_server_name}}"         # for type: mcp
        tools: [{{tool1}}, {{tool2}}]         # for type: mcp
        strategy: {{ac-driven|scripted}}      # for type: mcp
        evidence: {{screenshots|logs|report}}

  visual:
    enabled: {{true|false}}
    executors:
      - name: "{{name}}"
        type: {{cli|skill|mcp}}
        # Percy, Chromatic, Jest snapshots, screenshot diff

  performance:
    enabled: {{true|false}}
    executors:
      - name: "{{name}}"
        type: {{cli|mcp}}
        # k6, Artillery, Lighthouse CI, timing assertions
        # timing_assertions: [{ metric: "p95", threshold_ms: 200 }]

  security:
    enabled: {{true|false}}
    executors:
      - name: "{{name}}"
        type: cli
        # npm audit, Snyk, OWASP ZAP, secrets scan

  manual:
    enabled: {{true|false}}
    executors:
      - name: "{{name}}"
        type: manual
        generate_checklist: true
        categories: [{{exploratory|accessibility|edge-cases|device-matrix}}]
        device_matrix: ["{{device1}}", "{{device2}}"]   # optional

# Optional cross-cutting config:
test_data:
  strategy: {{fixtures|factories|seeds|snapshots|none}}
  setup_command: "{{command}}"
  teardown_command: "{{command}}"

# Optional safety/regulatory config:
# safety:
#   enabled: true
#   standard: {{iso-26262|do-178c|iec-61508}}
#   traceability: true
```

**Tier Orchestration:**

| Tier | Runs When | Gate |
|------|-----------|------|
| static | Pre-unit during APPLY | Task completion |
| unit | Per-task during APPLY | Task completion |
| integration | At plan checkpoints | Checkpoint |
| e2e | VERIFY phase | Phase completion |
| mcp_driven | VERIFY phase | Phase completion |
| visual | VERIFY phase | Phase completion |
| performance | VERIFY or checkpoint | Phase completion |
| security | VERIFY phase | Phase completion |
| platform | Milestone completion | Milestone |
| manual | VERIFY phase | Phase completion |

---

## Verification Checklist

During UNIFY, confirm:
- [ ] Required skills were invoked for matching work types
- [ ] Gaps documented in STATE.md Deviations section
- [ ] Patterns updated if intentional deviation is now standard
- [ ] Test report generated for all enabled tiers
- [ ] All test failures routed to /forge:plan-fix or /forge:debug

### Skill Audit Template

Use this during UNIFY to track invocations:

| Expected Skill | Invoked? | Gap? | Notes |
|----------------|----------|------|-------|
| {{/skill}} | ✓/○ | Yes/- | {{context}} |

### Test Audit Template

| Tier | Executor | Status | Failures | Coverage |
|------|----------|--------|----------|----------|
| {{tier}} | {{name}} | ✓/✗ | {{count}} | {{pct}}% |

---

## Amendment History

| Date | Change | Reason |
|------|--------|--------|
| {{timestamp}} | Initial creation | Project setup |

---

*Generated by `/forge:flows` or `/forge:init`*
*Reference: @references/specialized-workflow-integration.md*
*Test flows: @references/test-flows.md*
