<purpose>
Reverse-engineer FORGE state from an existing project. Produces a fully populated
`.forge/` directory by analyzing git history, codebase structure, package metadata,
and documentation — then presenting everything for user approval before writing.

This is the "join mid-flight" flow. Unlike `/forge:init` which asks questions from
scratch, retrofit discovers answers from what already exists.
</purpose>

<philosophy>
**Discover, don't interrogate.**

The codebase already knows what it is. Git already knows what happened. Package
metadata already knows the version. Don't ask the user to repeat what their
project can tell us.

The ONE thing only a human can provide: the core value — why this project matters.
Everything else is inference, presented for approval.
</philosophy>

<when_to_use>
- Existing project with git history, no `.forge/` directory
- Team adopting FORGE on a project that's been running for weeks/months/years
- Triggered via `/forge:retrofit` command
</when_to_use>

<required_reading>
@~/.claude/forge-framework/references/retrofit-history.md
@~/.claude/forge-framework/templates/PROJECT.md
@~/.claude/forge-framework/templates/ROADMAP.md
@~/.claude/forge-framework/templates/STATE.md
@~/.claude/forge-framework/templates/MILESTONES.md
@~/.claude/forge-framework/templates/forge-json.md
</required_reading>

<process>

<step name="preflight" priority="first">
**Guards and routing. Fail fast if retrofit isn't the right tool.**

1. Check for existing `.forge/` directory:
   ```bash
   ls -d .forge 2>/dev/null
   ```
   - If exists: "`.forge/` already exists. Use `/forge:resume` to continue or delete `.forge/` to re-retrofit."
   - **STOP** — do not proceed.

2. Check for resume state:
   ```bash
   cat .forge/.retrofit-state.json 2>/dev/null
   ```
   - If exists AND `--resume` flag: load checkpoint, skip to the first incomplete step.
   - If exists but no `--resume`: "Interrupted retrofit found. Run `/forge:retrofit --resume` to continue or delete `.forge/.retrofit-state.json` to restart."

3. Check for refine mode:
   - If `--refine=history`: load existing `.forge/`, re-run ONLY the history agent (Step 5 Agent 5), then jump to synthesis (Step 7).

4. Count commits to gauge project maturity:
   ```bash
   git rev-list --count HEAD 2>/dev/null
   ```
   - If 0 or error: "No git history found. Use `/forge:init` instead." **STOP.**
   - If < 100: Suggest: "This project has [N] commits — `/forge:init` might be faster and cheaper. Continue with retrofit? [1] Yes [2] Use init instead"
   - If user picks init: run `/forge:init` and **STOP.**

5. Parse mode from arguments:
   - `--mode=full` → full mode (all files + phase reconstruction)
   - default → standard mode
</step>

<step name="detect_project">
**Auto-detect project identity without asking the user.**

Run in parallel:
```bash
# Package metadata (try all ecosystems)
cat package.json 2>/dev/null
cat Cargo.toml 2>/dev/null
cat pyproject.toml 2>/dev/null
cat go.mod 2>/dev/null
cat CMakeLists.txt 2>/dev/null | head -5
cat build.gradle 2>/dev/null | head -10
cat *.cabal 2>/dev/null | head -5
cat mix.exs 2>/dev/null | head -5

# Git identity
git describe --tags --always 2>/dev/null
git rev-list --count HEAD
git log --reverse --format="%ai" -1
git log --format="%ai" -1
git tag -l --sort=-version:refname | head -10
git remote -v 2>/dev/null | head -4

# Existing docs
ls README* CHANGELOG* HISTORY* CHANGES* CONTRIBUTING* docs/ 2>/dev/null
```

Extract and display:
```
═══ FORGE RETROFIT ═══

Detected project:
  Name:         my-app (from package.json)
  Version:      2.1.0 (from git tag v2.1.0)
  Language:     TypeScript / Node.js
  Commits:      847 (over 2 years)
  Tags:         12 (v1.0.0 → v2.1.0)
  Contributors: 4
  Docs found:   README.md, CHANGELOG.md

  Mode: standard (use --mode=quick or --mode=full to change)

Correct? [1] Yes, continue [2] Edit details [3] Cancel
```

Wait for confirmation before proceeding.
</step>

<step name="detect_workflow_shape">
**Identify the team's git workflow to route the history agent correctly.**

Run detection heuristics:
```bash
# Merge commit ratio
MERGE_COUNT=$(git log --merges --oneline | wc -l)
TOTAL_COUNT=$(git rev-list --count HEAD)

# Squash-merge detection (commits on main with single parent, PR-like messages)
SQUASH_PATTERN=$(git log --first-parent --format="%s" -50 | grep -cE "^(Merge pull request|.*\(#[0-9]+\))")

# Branch count
BRANCH_COUNT=$(git branch -r --list 2>/dev/null | wc -l)

# Release branch pattern
RELEASE_BRANCHES=$(git branch -r --list 2>/dev/null | grep -cE "release/|hotfix/")
```

Classify and confirm:
```
Git workflow detected: [Standard / Squash-merge / Trunk-based / Multi-release]

Evidence:
  - [N] merge commits ([X]% of total)
  - [N] remote branches ([M] release branches)
  - [Conventional commits: Y%]

Is this right? [1] Yes [2] Actually we use [describe]
```

Store as `workflow_type` for the history agent.
</step>

<step name="create_skeleton">
**Create the .forge directory structure.**

```bash
mkdir -p .forge/phases .forge/codebase
```

Write initial checkpoint:
```json
// .forge/.retrofit-state.json
{
  "mode": "standard",
  "workflow_type": "standard",
  "started_at": "[timestamp]",
  "completed_agents": [],
  "project_name": "[detected]",
  "project_version": "[detected]",
  "user_core_value": null
}
```
</step>

<step name="spawn_agents">
**Launch parallel analysis agents. Agent types vary by mode.**

### Standard mode: 4 agents
- **Agent 1 (sonnet):** Stack + Integrations (from map-codebase)
- **Agent 2 (sonnet):** Architecture + Structure (from map-codebase)
- **Agent 3 (sonnet):** Conventions + Testing (from map-codebase)
- **Agent 4 (sonnet):** Concerns (from map-codebase)

### Full mode: 5 agents
- **Agents 1–4** as above
- **Agent 5 (haiku):** Git History Analysis

**Agent 5 prompt (history agent):**

Load the reference: @~/.claude/forge-framework/references/retrofit-history.md

Your task: analyze the git history of this project and produce the structured
`history_analysis` YAML output defined in the reference.

Project context:
- Name: {{project_name}}
- Version: {{project_version}}
- Workflow type: {{workflow_type}}
- Mode: full
- Since flag: {{since_tag or "none"}}

Follow the data source priority order from the reference:
1. Parse CHANGELOG/HISTORY first (if exists)
2. Parse git tags with annotations
3. Analyze commit patterns between tags
4. Cluster by file creation timeline (fallback)

Run the pre-processing gates:
1. Bot filter — exclude bot commits, report percentage
2. Fork detection — check for fork point, ask if found
3. Sensitive data scan — flag but don't redact yet (that happens at write time)

Use the git commands from the reference document. For Stage 2 (per-tag analysis),
only analyze the 10 most recent tags to manage token budget.

Return the `history_analysis` YAML structure from the reference.

**Important:** Use `model: "haiku"` for Agent 5 to minimize token cost. The work
is mostly git command execution and structured output — doesn't need full reasoning.

All agents run with `run_in_background: true`.

**Checkpoint after each agent completes:**
Update `.forge/.retrofit-state.json` → add agent name to `completed_agents[]`.
</step>

<step name="collect_results">
**Wait for all agents and aggregate findings.**

1. Collect results from all agents as they complete
2. For standard/full mode: write codebase map documents to `.forge/codebase/`:
   - stack.md, architecture.md, structure.md, conventions.md
   - integrations.md, testing.md, concerns.md
3. For full mode: parse Agent 5's `history_analysis` YAML output
4. Update checkpoint: `"collection_complete": true`
</step>

<step name="synthesize_state" priority="required">
**Transform agent findings into draft FORGE state files.**

This is the core logic step. Map findings to FORGE templates:

### PROJECT.md synthesis
```
name        ← package metadata (package.json name, Cargo.toml [package].name, etc.)
description ← README first paragraph, or package.json description
core_value  ← PLACEHOLDER — user must provide this
type        ← "Application" (default), infer from structure:
               - has src/commands/ → "CLI Tool"
               - has src/pages/ or src/app/ → "Web Application"
               - has android/ or ios/ → "Mobile Application"
               - has firmware/ or src/hal/ → "Embedded System"
               - has lib/ only → "Library"
version     ← git describe --tags, or package.json version, or "0.0.0"
status      ← infer from activity:
               - commits in last 30 days + version > 1.0 → "Production"
               - commits in last 30 days + version < 1.0 → "MVP"
               - no commits in 90+ days → "Maintenance"
               - < 50 commits total → "Prototype"
tech_stack  ← from Agent 1 (stack analysis)
features    ← from Agent 5 history_analysis.milestones[].phases[].features
               - validated (shipped): features from completed milestones
               - active: features from current milestone in-progress phases
               - planned: empty (can't infer future plans from history)
constraints ← from Agent 4 (concerns) + Agent 1 (stack constraints)
key_decisions ← from Agent 5 history_analysis.key_decisions[]
```

### ROADMAP.md synthesis (standard + full modes)
```
For each milestone in history_analysis.milestones[]:
  - Create milestone section with version, date, status
  - For each phase: name, goal (from features), status (complete/active)
  - Current milestone: mark as "In progress" if commits_since_last_tag > 0
  - Future milestones: empty (retrofit doesn't predict the future)
```

### MILESTONES.md synthesis (full mode only)
```
For each completed milestone in history_analysis.milestones[]:
  - Version, date, git range (tag..tag or date range)
  - Stats: commit count, file count, contributor count
  - Delivered features (from phase features list)
  - Key decisions made during this milestone
```

### STATE.md synthesis
```
milestone   ← latest milestone (active or most recent completed)
phase       ← if active branches exist: infer phase from branch name
               otherwise: "Ready for planning"
plan        ← null (retrofit starts in IDLE)
status      ← "Retrofitted — IDLE"
loop        ← ○ ○ ○ (all pending — ready for first /forge:plan)
last_activity ← latest git commit date + "Retrofit initialized"
```

### forge.json synthesis
```json
{
  "name": "[project_name]",
  "version": "[current_version]",
  "milestone": {
    "name": "[current milestone name]",
    "version": "[current version]",
    "status": "[in_progress or complete]"
  },
  "phase": {
    "number": null,
    "name": null,
    "status": "not_started"
  },
  "loop": {
    "plan": null,
    "position": "IDLE"
  },
  "timestamps": {
    "created_at": "[now]",
    "updated_at": "[latest commit date]",
    "retrofitted_from": "[repo birthday]"
  },
  "satellite": { "groom": true }
}
```
</step>

<step name="present_for_approval" priority="required">
**Show the user what retrofit discovered, with confidence scores and evidence.**

Format:
```
═══════════════════════════════════════════════
FORGE RETROFIT — REVIEW
═══════════════════════════════════════════════

PROJECT.md:
  Name:       my-app                      ✓ from package.json
  Type:       Web Application             ✓ inferred (src/pages/ detected)
  Version:    2.1.0                       ✓ from git tag
  Status:     Production                  ✓ inferred (2yr old, active commits)
  Stack:      TypeScript, React, Postgres ✓ from codebase analysis
  Features:   shipped=24 active=3         ✓ from git history
  Core Value: ⚠ NEEDS YOUR INPUT

  ✏ Edit? [yes / no / show evidence]

───────────────────────────────────────────────

ROADMAP.md:  [HIGH confidence — from tags + CHANGELOG]

  v1.0 (2024-03): 4 phases ✓ complete
    ├─ Authentication      (38 commits, 12 files)
    ├─ API Layer           (45 commits, 18 files)
    ├─ UI Components       (67 commits, 24 files)
    └─ Deployment          (12 commits, 6 files)

  v1.1 (2024-06): 2 phases ✓ complete
    ├─ Payments            (84 commits, 22 files)
    └─ Notifications       (31 commits, 9 files)

  v2.0 (2025-01): 3 phases ✓ complete
    ├─ GraphQL Rewrite     (142 commits, 47 files)
    ├─ Data Migration      (38 commits, 12 files)
    └─ Launch              (24 commits, 8 files)

  v2.1 (active): 2 phases ◐ in progress
    ├─ Performance         (18 commits, 7 files)
    └─ Mobile Integration  (6 commits, 3 files) ← from feat/mobile branch

  ✏ Edit? [yes / no / show commits for a phase]

───────────────────────────────────────────────

MILESTONES.md:  [3 entries — full mode]
STATE.md:       [IDLE — ready for /forge:plan]
forge.json:     [v2.1.0, in_progress]

═══════════════════════════════════════════════
Continue? [1] Approve all  [2] Edit a section  [3] Cancel
═══════════════════════════════════════════════
```

If user picks "show evidence": display the actual git commits and file paths
that backed each inference. This builds trust.

If user picks "Edit a section": present that section's fields for inline editing.
Re-display after edit for final confirmation.
</step>

<step name="get_core_value" priority="required">
**The one question retrofit MUST ask.**

```
One last question — the only thing git can't tell me:

In one sentence, what's the core value this project delivers?
(Example: "Helps small businesses accept payments without a developer")
```

This populates PROJECT.md `core_value` field. It's the North Star for all
future `/forge:plan` decisions.
</step>

<step name="scan_and_write" priority="required">
**Sensitive data check, then write all files.**

1. Run sensitive data scanner on all draft content:
   ```
   Scan for: JIRA tickets, internal emails, customer names, secrets
   ```
   If found:
   ```
   ⚠ Found potentially sensitive data in retrofit output:
     - 8 JIRA ticket references
     - 3 internal email addresses

   [1] Redact all (replace with generic references)
   [2] Review each
   [3] Keep as-is (I'll review before committing)
   ```

2. Write all `.forge/` files using approved data:
   - PROJECT.md (from template + synthesis)
   - ROADMAP.md (from template + synthesis)
   - STATE.md (from template + synthesis)
   - forge.json
   - config.md (minimal defaults)
   - MILESTONES.md (full mode)
   - All 7 codebase documents (standard + full modes)

3. Remove checkpoint file:
   ```bash
   rm .forge/.retrofit-state.json
   ```

4. Display file list:
   ```
   ✓ Written .forge/PROJECT.md
   ✓ Written .forge/ROADMAP.md
   ✓ Written .forge/STATE.md
   ✓ Written .forge/forge.json
   ✓ Written .forge/config.md
   ✓ Written .forge/MILESTONES.md
   ✓ Written .forge/codebase/ (7 documents)
   ```
</step>

<step name="commit_and_route">
**Commit and guide the user forward.**

```bash
git add .forge/
git commit -m "docs: retrofit FORGE state from existing project history

Retrofitted from $(git rev-list --count HEAD) commits spanning $(git log --reverse --format=%ai -1 | cut -d' ' -f1) to $(date +%Y-%m-%d).
Milestones: [N] complete, [M] active.
Mode: [quick/standard/full].
"
```

Display:
```
═══════════════════════════════════════════════
RETROFIT COMPLETE
═══════════════════════════════════════════════

Your project is now FORGE-managed.

  Milestones reconstructed: [N]
  Phases identified: [M]
  Current position: [milestone] — IDLE

What's next?
  /forge:progress  — see suggested next action
  /forge:plan      — start planning the next phase
  /forge:test brainstorm — set up test flows

═══════════════════════════════════════════════
```
</step>

</process>

<error_handling>

**Agent timeout/failure:**
- If any agent fails, checkpoint saves completed agents.
- User can resume with `/forge:retrofit --resume`.
- Failed agent is retried once. If still fails: proceed without that agent's data,
  note the gap in the output.

**Git not available:**
- If `git` commands fail: "This directory is not a git repository. Use `/forge:init` instead."

**No useful data found:**
- If no tags, no CHANGELOG, no conventional commits, <10 commits:
  "Not enough history to reconstruct. Routing to `/forge:init` for manual setup."

**User disconnects mid-approval:**
- Checkpoint preserves all synthesis. Resume picks up at approval step.

</error_handling>

<anti_patterns>

**Asking questions the codebase answers:**
Do NOT ask "What language is this project?" when package.json is right there.
Retrofit discovers; init interviews.

**Presenting raw git output:**
Users don't want to see 200 commit hashes. Show human-readable summaries with
confidence scores. Only show raw evidence when explicitly requested.

**Overriding user judgment:**
If the user says "that phase name is wrong," change it. Don't argue that
"the git history suggests otherwise." The user knows their project.

**Writing files before approval:**
NEVER write `.forge/` files before the user approves. The review step is
non-negotiable. Exception: `.forge/.retrofit-state.json` (checkpoint only).

</anti_patterns>
