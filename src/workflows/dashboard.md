<purpose>
Gather all FORGE project state and render a single-screen dashboard. Reads every
.forge/ file, git status, test profile, and special flows — then formats into a
coherent overview.

This is a READ-ONLY workflow. It never writes to .forge/ files (except --html
which writes a dashboard.html visualization).
</purpose>

<philosophy>
**One glance, full picture.**

A developer should be able to run `/forge:dashboard` and know: where am I, what's
next, what's broken, what's configured, and how healthy is this project — in under
10 seconds of reading.
</philosophy>

<when_to_use>
- Start of any session (before /forge:progress)
- After long breaks to re-orient
- When onboarding someone to the project
- When deciding what to work on next
- When showing project status to stakeholders
</when_to_use>

<required_reading>
@.forge/PROJECT.md
@.forge/ROADMAP.md
@.forge/STATE.md
@.forge/SPECIAL-FLOWS.md (if exists)
@.forge/config.md (if exists)
</required_reading>

<process>

<step name="gather_state" priority="first">
**Read all .forge/ state files. Fail gracefully if any are missing.**

1. Check .forge/ exists:
   ```bash
   ls -d .forge 2>/dev/null
   ```
   If not: "No .forge/ directory found. Run `/forge:init` or `/forge:retrofit` first." **STOP.**

2. Read each file (skip if missing, note as "not configured"):
   - `.forge/PROJECT.md` → project name, type, version, status, core_value, tech_stack
   - `.forge/ROADMAP.md` → milestones (completed, active, planned), phases per milestone
   - `.forge/STATE.md` → current position (milestone, phase, plan, status), loop position, blockers, deferred issues, decisions
   - `.forge/SPECIAL-FLOWS.md` → test_profile, project-level skill dependencies
   - `.forge/config.md` → integrations (SonarQube, enterprise audit, etc.)
   - `.forge/forge.json` → machine-readable state snapshot

3. If any critical file missing (PROJECT.md or STATE.md), note in output:
   ```
   ⚠ Missing: PROJECT.md — run /forge:init or /forge:retrofit
   ```
</step>

<step name="gather_git_health">
**Pull real-time metrics from git.**

```bash
# Recent activity (last 5 commits)
git log --oneline -5 --format="%ar  %s"

# Commit frequency (last 30 days)
git log --since="30 days ago" --oneline | wc -l

# Current branch
git branch --show-current

# Uncommitted changes
git status --short | wc -l

# Contributors (last 90 days)
git shortlog -sn --since="90 days ago" --no-merges | wc -l

# Latest tag
git describe --tags --always 2>/dev/null
```
</step>

<step name="gather_test_status">
**Extract test profile configuration and latest results.**

1. Parse `test_profile:` from SPECIAL-FLOWS.md:
   - For each tier: is it enabled? What executor? What coverage threshold?
2. Check for latest TEST-REPORT.md:
   ```bash
   find .forge/phases -name "TEST-REPORT.md" -type f 2>/dev/null | sort | tail -1
   ```
   If found: extract summary table (pass/fail/skip counts, coverage %)
3. Check for flaky tests:
   ```bash
   cat .forge/flaky-tests.md 2>/dev/null | grep -c "quarantined"
   ```
</step>

<step name="gather_special_flows">
**Extract configured skill dependencies.**

Parse SPECIAL-FLOWS.md `## Project-Level Dependencies` table:
- Skill name, work type, priority (required/optional), status
</step>

<step name="compute_progress">
**Calculate progress metrics from ROADMAP.md.**

1. Count total milestones, completed milestones, active milestone
2. For active milestone: count total phases, completed phases, active phase
3. For active phase: count total plans (from STATE.md or phase directory), completed plans
4. Calculate progress percentages:
   - Milestone progress: `completed_phases / total_phases * 100`
   - Phase progress: `completed_plans / total_plans * 100` (or `completed_tasks / total_tasks` if in APPLY)
5. Build progress bars:
   - Full block: `█` for each 5% completed
   - Empty block: `░` for remaining
</step>

<step name="identify_actions">
**Determine suggested next actions based on current state.**

Priority order:
1. If blockers exist → "Resolve blockers first" + list them
2. If deferred issues > 5 → "Consider running /forge:consider-issues"
3. If uncommitted changes > 0 → "Uncommitted changes detected"
4. If loop position = IDLE → "/forge:plan — start next phase"
5. If loop position = PLAN complete → "/forge:apply — execute the plan"
6. If loop position = APPLY complete → "/forge:verify — test the output"
7. If loop position = VERIFY complete → "/forge:unify — reconcile"
8. If all phases complete → "/forge:complete-milestone"
9. If test profile not configured → "/forge:test brainstorm — set up testing"
10. Default → "/forge:progress — see routing"
</step>

<step name="render_terminal">
**Format and display the dashboard (terminal mode — default).**

```
═══════════════════════════════════════════════════════════
FORGE DASHBOARD — {{project_name}} v{{version}}
═══════════════════════════════════════════════════════════

PROJECT                            HEALTH
  Type: {{type}}                     Commits (30d): {{commit_count}}
  Status: {{status}}                 Uncommitted: {{dirty_count}}
  Branch: {{branch}}                 Contributors (90d): {{contributor_count}}
  Core Value: {{core_value}}         Tag: {{latest_tag}}
  Stack: {{tech_stack}}

───────────────────────────────────────────────────────────

MILESTONE: {{milestone_name}} — {{milestone_version}}
  {{milestone_progress_bar}}  {{milestone_pct}}%

  {{#each phases}}
  Phase {{number}}: {{name}}    {{status_icon}} {{status}}
    {{#if is_active}}
    └─ Plan {{plan_id}}       {{plan_status_icon}} {{plan_status}} (task {{current_task}}/{{total_tasks}})
    {{/if}}
  {{/each}}

LOOP POSITION
  PLAN ──▶ APPLY ──▶ UNIFY
    {{plan_icon}}        {{apply_icon}}        {{unify_icon}}     [{{loop_description}}]

───────────────────────────────────────────────────────────

TEST PROFILE                       SPECIAL FLOWS
  {{#each test_tiers}}               {{#each special_flows}}
  {{tier_name}}:  {{status_icon}} {{executor}}  {{skill_name}} → {{work_type}} ({{priority}})
  {{/each}}                          {{/each}}
  {{#if no_test_profile}}            {{#if no_special_flows}}
  ⚠ Not configured                   None configured
  Run /forge:test brainstorm         Run /forge:flows
  {{/if}}                            {{/if}}

  {{#if coverage}}
  Coverage: {{coverage_pct}}% (threshold: {{coverage_min}}%)
  {{/if}}
  {{#if flaky_count}}
  Flaky tests: {{flaky_count}} quarantined
  {{/if}}

───────────────────────────────────────────────────────────

RECENT ACTIVITY
  {{#each recent_commits}}
  {{time_ago}}  {{message}}
  {{/each}}

{{#if blockers}}
⛔ BLOCKERS
  {{#each blockers}}
  - {{description}}
  {{/each}}
{{/if}}

{{#if deferred_issues}}
📋 DEFERRED ISSUES: {{deferred_count}} (run /forge:consider-issues)
{{/if}}

───────────────────────────────────────────────────────────
▶ NEXT: {{suggested_action}}
═══════════════════════════════════════════════════════════
```

**Formatting rules:**
- Status icons: ✅ complete, ◐ in progress, ○ not started, ⛔ blocked, ⚠ warning
- Progress bars: `██████████░░░░░░░░░░ 50%`
- Timestamps: relative ("2h ago", "1d ago", "3w ago")
- Keep total output under 40 lines — dashboard, not a report
- Truncate tech stack to top 3 items if long
- Truncate core value to 40 chars with ellipsis if needed
</step>

<step name="render_html" gate="flag:--html">
**Generate interactive HTML dashboard (only if --html flag present).**

1. Gather the same data as terminal render
2. Write HTML dashboard to `.forge/dashboard.html` using the template from
   @~/.claude/forge-framework/templates/dashboard.html
3. Display: "Dashboard written to .forge/dashboard.html — open in browser to view"

The HTML version includes:
- Clickable milestone/phase sections that expand to show commit details
- Live progress bars with animations
- Test tier status cards (same style as test-flows.html)
- Color-coded health metrics
- Suggested action as a prominent call-to-action button
</step>

</process>

<anti_patterns>

**Showing too much detail:**
This is a dashboard, not a dump. 40 lines max. Show summaries, not raw file contents.
If the user wants detail, they run the specific command (/forge:progress, /forge:test report).

**Hiding bad news:**
If there are blockers, failing tests, or stale issues — surface them prominently.
The dashboard builds trust by showing reality, not a rosy picture.

**Running expensive operations:**
Dashboard is read-only and fast. Don't run tests, don't analyze git history deeply,
don't spawn agents. Just read .forge/ files + basic git commands.

**Writing to .forge/ files:**
Dashboard NEVER modifies state files. Exception: `.forge/dashboard.html` in --html mode.

</anti_patterns>
