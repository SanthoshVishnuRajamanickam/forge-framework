<purpose>
Guide the user through discovering their testing needs before configuring a test profile.
This is the "discuss" equivalent for testing — explore what matters before locking in tools.

The brainstorm produces a `.forge/TEST-STRATEGY-NOTES.md` that feeds into `/forge:test configure`.
Users leave with clarity on: what to test, what to automate, what tools to use, and what
they can defer.
</purpose>

<when_to_use>
- New project, first time setting up test flows
- Existing project adding test automation for the first time
- Major architecture change that invalidates prior test strategy
- User says "I don't know where to start with testing"
- Before `/forge:test configure` when the user hasn't thought through their needs
</when_to_use>

<philosophy>
**Meet the user where they are.** A solo developer building a CLI tool doesn't need
to hear about device farms. An automotive team doesn't need Lighthouse scores. The
brainstorm adapts to the project's reality — not a checklist to endure.
</philosophy>

<required_reading>
@.forge/PROJECT.md (project context — what is this project?)
@.forge/codebase/ (if exists — what tech stack?)
</required_reading>

<references>
@~/.claude/forge-framework/references/test-flows.md
</references>

<process>

<step name="understand_the_project" priority="first">
**Before asking about testing, understand what's being built.**

1. Read PROJECT.md and any codebase map (`.forge/codebase/`)
2. If neither exists, ask:
   ```
   Before we talk about testing, help me understand the project:

   1. What are you building? (web app, mobile app, API, embedded firmware, CLI tool, library, etc.)
   2. Who uses it? (end users, other developers, machines, safety-critical systems?)
   3. What's the deployment target? (cloud, app store, device, embedded hardware?)
   ```
3. From the answers, classify the project type:
   - **Web app** (frontend + backend, browser-based)
   - **API / backend** (no UI, consumed by other services)
   - **Mobile app** (iOS, Android, cross-platform)
   - **Desktop app** (Electron, Qt, native)
   - **Embedded / firmware** (RTOS, bare metal, safety-critical)
   - **Library / package** (consumed by other developers)
   - **CLI tool** (terminal-based)
   - **Multi-platform** (combination of the above)

Store as `project_type`. This shapes every question that follows.
</step>

<step name="explore_what_matters">
**Discover testing priorities by asking about risk, not tools.**

Present 3–5 questions adapted to the project type. Don't ask all of these — pick
the ones that matter for THIS project.

**For all project types:**
```
What would a bug cost you?

Think about the last time something broke (or imagine if it did):
  - Would users see it? (broken UI, wrong data, crash)
  - Would money be lost? (payments, subscriptions, contracts)
  - Would safety be at risk? (medical, automotive, industrial)
  - Would trust be lost? (data breach, downtime, incorrect results)

What's the scariest failure you can imagine?
```

Wait for response. This calibrates the entire brainstorm — a hobby project and
a medical device get very different treatment.

**For web apps, also ask:**
```
How do your users interact with the product?

  - Critical user journeys (login, checkout, data entry)?
  - Pages that must load fast (landing, dashboard)?
  - Third-party integrations (payments, auth, APIs)?
  - Accessibility requirements (compliance, WCAG level)?
```

**For mobile apps, also ask:**
```
What devices and conditions matter?

  - Must-support devices (specific phones, OS versions)?
  - Offline behavior (does the app work without network)?
  - Hardware features (camera, Bluetooth, NFC, GPS)?
  - App store requirements (review guidelines, crash rate thresholds)?
```

**For embedded/firmware, also ask:**
```
What are the hardware and safety constraints?

  - Target hardware (MCU family, architecture)?
  - Safety standard (ISO 26262, DO-178C, IEC 61508, none)?
  - Real-time requirements (latency budgets, interrupt deadlines)?
  - Communication protocols (CAN, SPI, I2C, Bluetooth, WiFi)?
  - Simulation available (QEMU, Renode, vendor simulator)?
```

**For APIs/backends, also ask:**
```
What contracts and performance budgets exist?

  - API consumers (frontend, mobile, third-party)?
  - SLAs or latency budgets (p95 < 200ms)?
  - Data integrity requirements (financial, PII, compliance)?
  - External service dependencies (databases, caches, queues)?
```

**For libraries, also ask:**
```
What does your consumer surface look like?

  - Public API surface size (small utility vs large framework)?
  - Backwards compatibility commitments?
  - Supported platforms/runtimes (Node versions, Python versions)?
  - Type safety requirements (TypeScript, mypy)?
```
</step>

<step name="map_risks_to_tiers">
**Translate the user's answers into test tier recommendations.**

Based on what the user said matters, suggest which tiers apply. Present as a
conversation, not a table dump.

```
Based on what you've told me, here's what I'd recommend testing:

[Adapt this to the project — don't list all 10 tiers]

DEFINITELY:
  - [tier]: [why, based on what user said]
  - [tier]: [why]

PROBABLY:
  - [tier]: [why, but lower priority]

SKIP FOR NOW:
  - [tier]: [why it doesn't apply yet]

Does this match your intuition? Anything feel wrong or missing?
```

Wait for response. The user may push back — "we don't need visual testing" or
"actually, performance is more important than I suggested." Adjust.
</step>

<step name="explore_existing_tests">
**Discover what testing already exists in the project.**

1. Auto-detect existing test infrastructure:
   ```bash
   # Check for test frameworks
   ls package.json pyproject.toml Cargo.toml CMakeLists.txt build.gradle 2>/dev/null
   ```

2. If package.json exists:
   ```bash
   # Check for test scripts and dependencies
   node -e "const p=require('./package.json'); console.log('scripts:', JSON.stringify(p.scripts||{})); console.log('deps:', Object.keys({...p.devDependencies,...p.dependencies}).filter(d => /jest|vitest|mocha|cypress|playwright|testing/.test(d)).join(', '))"
   ```

3. Search for existing test files:
   ```bash
   find . -maxdepth 4 \( -name "*.test.*" -o -name "*.spec.*" -o -name "test_*" -o -name "*_test.*" \) -not -path "*/node_modules/*" -not -path "*/.forge/*" 2>/dev/null | head -20
   ```

4. Present findings:
   ```
   I found some existing test infrastructure:

   Framework: [vitest / jest / pytest / etc.]
   Test files: [N] files found
   Test script: [npm test / pytest / etc.]
   Coverage: [available / not configured]

   [If tests exist:]
   Great — we're not starting from zero. Let's build on what you have.

   [If no tests exist:]
   No existing tests found. That's fine — we'll figure out where to start.
   ```
</step>

<step name="discuss_automation_vs_manual">
**Help the user decide what to automate, what to keep manual, and what AI can do.**

```
For each tier we identified, let's decide HOW to test:

[For each recommended tier, present the options relevant to this project]

[TIER NAME]:
  Option A: Automated (CLI) — [tool suggestion based on stack]
             Pro: runs every time, fast feedback
             Con: needs setup, maintenance

  Option B: Skill-driven — [if a relevant skill exists]
             Pro: reusable, configurable
             Con: skill must be installed

  Option C: MCP-driven (AI tests it) — [if MCP server available]
             Pro: no scripts to write, tests from acceptance criteria
             Con: slower, needs MCP server running

  Option D: Manual (human checklist)
             Pro: no setup, catches things automation misses
             Con: slow, not repeatable, depends on human discipline

What feels right for [tier]?
```

Don't push automation on everything. Sometimes manual is the right call for v1.
Let the user make the choice.
</step>

<step name="discuss_tools_and_executors">
**For each tier+mode combination, suggest specific tools.**

Only suggest tools that match the detected stack. Don't suggest Jest for a Python project.

```
For [tier] with [mode], here are your options:

[Based on detected stack:]
  - [Tool 1]: [one-line description + tradeoff]
  - [Tool 2]: [one-line description + tradeoff]

[If MCP servers are available:]
  - [MCP server]: Already installed, can test via AI
    Would you like to see a demo of how AI-driven testing works?

Which tool (or tools) do you want to use?
```

If the user is unsure, offer to run a quick demo:
- For MCP-driven: use Playwright MCP to navigate one page and take a screenshot
- For CLI: run existing test command and show output format
- For manual: show what a generated checklist looks like from sample AC
</step>

<step name="capture_decisions">
**Write decisions to .forge/TEST-STRATEGY-NOTES.md**

This is NOT the test profile yet — it's a readable summary of decisions that
feeds into `/forge:test configure`.

```markdown
# Test Strategy Notes

**Project:** [name]
**Type:** [project_type]
**Date:** [timestamp]
**Brainstormed with:** /forge:test brainstorm

## What matters most
[User's answer about risk/cost of bugs]

## Tier decisions

### [Tier name] — [ENABLED / SKIP]
- **Why:** [reason from conversation]
- **Mode:** [automated / skill / mcp-driven / manual]
- **Tool:** [specific tool chosen]
- **Notes:** [any user preferences or constraints]

### [Next tier...]
...

## Existing infrastructure
- Framework: [detected]
- Test files: [count]
- Coverage: [status]

## Open questions
- [Anything unresolved — "revisit performance testing after MVP"]
- [Things to try later — "explore MCP-driven E2E once app has stable routes"]

## Next step
Run `/forge:test configure` to generate the test_profile from these decisions.
```

Write file and confirm:
```
Saved your test strategy notes to .forge/TEST-STRATEGY-NOTES.md

Ready to configure your test profile?
  [1] Yes, run /forge:test configure now
  [2] Not yet — I want to think about it
  [3] Edit the notes first
```
</step>

</process>

<anti_patterns>

**Dumping all 10 tiers on the user:**
Don't present a wall of options. Filter to what matters for THIS project. A CLI tool
doesn't need visual regression or device farms. Show 3–5 tiers, not 10.

**Pushing automation everywhere:**
Some things are better tested manually, especially early on. Respect the user's
judgment about what to automate now vs later.

**Assuming tool knowledge:**
Don't say "obviously you'd use k6 for load testing." The user might not know what
k6 is. Explain briefly and let them choose.

**Skipping the "why" conversation:**
If you jump straight to "which testing framework?" without understanding what
matters, you'll configure tests that don't catch the bugs the user actually fears.

**Making it feel like homework:**
This should be a conversation, not an interrogation. If the user seems overwhelmed,
simplify: "Let's just start with unit tests and manual checks. We can add more later."

</anti_patterns>

<output>
- `.forge/TEST-STRATEGY-NOTES.md` — readable summary of all decisions
- User has clarity on what to test, how, and with what tools
- Natural handoff to `/forge:test configure`
</output>
