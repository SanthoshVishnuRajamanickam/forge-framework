---
name: forge:progress
description: Smart status with routing - suggests ONE next action
argument-hint: "[context]"
allowed-tools: [Read]
---

<objective>
Show current progress and **route to exactly ONE next action**. Prevents decision fatigue by suggesting a single best path.

**When to use:**
- Mid-session check on progress
- After `/forge:resume` for more context
- When unsure what to do next
- To get a tailored suggestion based on your current focus
</objective>

<execution_context>
</execution_context>

<context>
$ARGUMENTS

@.forge/STATE.md
@.forge/ROADMAP.md
</context>

<process>

<step name="load_state">
Read `.forge/STATE.md` and `.forge/ROADMAP.md`:
- Current phase and total phases
- Current plan (if any)
- Loop position (PLAN/APPLY/VERIFY/UNIFY markers)
- Roadmap progress
- Performance metrics (if tracked)
- Blockers or concerns

Also check `.forge/config.md` (if exists):
- Is `enterprise_plan_audit: enabled: true`?
- If plan is at "created, awaiting approval" stage: check if STATE.md mentions "audited"
- Store `audit_enabled` and `audit_completed` flags for routing
</step>

<step name="check_for_updates">
Check if FORGE has been updated since the user last ran it:

1. Read `~/.claude/forge-framework/package.json` → extract `version`
2. Read `.forge/forge.json` → extract `forge_version`
3. If installed version is newer than `forge_version` (or `forge_version` missing):
   - Read `~/.claude/forge-framework/references/whats-new.md`
   - Show banner for new version(s), update `forge.json` `forge_version`
   - Banner format:
   ```
   ╔══════════════════════════════════════════════════════╗
   ║  FORGE Updated → v{new_version}                      ║
   ╠══════════════════════════════════════════════════════╣
   ║  What's new: [top 3-5 bullets]                       ║
   ║  Run /forge:help for all commands                    ║
   ╚══════════════════════════════════════════════════════╝
   ```
4. If `.forge/forge.json` not present, skip silently.
</step>

<step name="calculate_progress">
Determine overall progress:

**Milestone Progress:**
- Phases complete: X of Y
- Current phase progress: Z%

**Current Loop:**
- Position: PLAN/APPLY/UNIFY
- Status: [what's happening]
</step>

<step name="consider_user_context">
**If `[context]` argument provided:**

User has given additional context about their current focus or constraint.
Factor this into routing decision:
- "I need to fix a bug first" → prioritize that over planned work
- "I only have 30 minutes" → suggest smaller scope
- "I want to finish this phase" → stay on current path
- "I'm stuck on X" → suggest debug or research approach

**If no argument:** Use default routing based on state alone.
</step>

<step name="determine_routing">
Based on state (+ user context if provided), determine **ONE** next action:

**Default routing (no user context):**

| Situation | Single Suggestion |
|-----------|-------------------|
| No plan exists | `/forge:plan` |
| Plan awaiting approval (audit enabled, not yet audited) | `/forge:audit [path]` |
| Plan awaiting approval (audit complete or not enabled) | "Approve plan to proceed" |
| Plan approved, not executed | `/forge:apply [path]` |
| Applied, not verified | `/forge:verify` |
| Verified, not unified | `/forge:unify [path]` |
| Loop complete, more phases | `/forge:plan` (next phase) |
| Milestone complete | "Create next milestone or ship" |
| Blockers present | "Address blocker: [specific]" |
| Context at DEEP/CRITICAL | `/forge:pause` |

**With user context:** Adjust suggestion to align with stated intent.

**IMPORTANT:** Suggest exactly ONE action. Not multiple options.
</step>

<step name="display_progress">
Show progress with single routing:

```
════════════════════════════════════════
FORGE PROGRESS
════════════════════════════════════════

Milestone: [name] - [X]% complete
├── Phase 1: [name] ████████████ Done
├── Phase 2: [name] ████████░░░░ 70%
├── Phase 3: [name] ░░░░░░░░░░░░ Pending
└── Phase 4: [name] ░░░░░░░░░░░░ Pending

Current Loop: Phase 2, Plan 02-03
┌──────────────────────────────────────────────┐
│  PLAN ──▶ APPLY ──▶ VERIFY ──▶ UNIFY        │
│    ✓        ✓         ○          ○           │
└──────────────────────────────────────────────┘

────────────────────────────────────────
▶ NEXT: /forge:unify .forge/phases/02-features/02-03-PLAN.md
  Close the loop and update state.
────────────────────────────────────────

Type "yes" to proceed, or provide context for a different suggestion.
```
</step>

<step name="context_advisory">
If context is at DEEP or CRITICAL bracket:

```
⚠️ Context Advisory: Session at [X]% capacity.
   Recommended: /forge:pause before continuing.
```
</step>

</process>

<success_criteria>
- [ ] Overall progress displayed visually
- [ ] Current loop position shown
- [ ] Exactly ONE next action suggested (not multiple)
- [ ] User context considered if provided
- [ ] Context advisory shown if needed
</success_criteria>
