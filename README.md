# Forge Framework

**Autonomous Engineering on PAUL patterns** — PRD intake, self-healing plan/apply/verify/unify loop, and dynamic stack adapters. Built on top of [PAUL](https://github.com/ChristopherKahler/paul)'s Plan-Apply-Unify loop.

```bash
npx forge-framework --global
```

> Running `npx forge-framework` with no flag launches an interactive prompt
> asking whether to install globally (`~/.claude/`) or locally (`./.claude/`).
> Pass `--global` or `--local` to skip the prompt.

Forge clones PAUL's loop discipline and adds three subsystems:

1. **Intake** — converts any input (PDF, Word, Markdown, raw idea) into a structured requirements xlsx via a multi-agent flow, with human-gated review.
2. **Autonomous phase runner** — wraps `/forge:plan`, `/forge:apply`, `/forge:verify`, `/forge:unify` in a self-heal loop that runs without human intervention inside a milestone, with configurable iteration caps.
3. **Dynamic stack adapters** — per-project build/test/deploy scripts generated via a brainstorming session and owned by the user after generation. Supports web, CLI, mobile, and embedded targets.

## Installation

```bash
npx forge-framework --global      # install to ~/.claude/
npx forge-framework --local       # install to ./.claude/
npx forge-framework --help        # show options
```

After install, launch Claude Code and run `/forge:help` for the full command reference.

> Re-running the installer on top of an existing install is safe: your current
> `commands/forge/` and `forge-framework/` directories are renamed to
> `*.backup-<timestamp>` before the new files are written.

## Quickstart

Once installed, a typical first project looks like this:

```text
/forge:init              # scaffold .forge/ and answer conversational setup
/forge:milestone         # define the first milestone
/forge:discuss           # explore the first phase
/forge:plan              # write a PLAN.md for the phase
/forge:apply             # execute the approved plan
/forge:verify            # user-acceptance test the output
/forge:unify             # reconcile plan vs actual, update STATE.md
/forge:complete-milestone  # finalize once all phases are done
```

Between sessions, `/forge:pause` writes a HANDOFF file and `/forge:resume`
picks up where you left off. `/forge:progress` at any time routes you to the
single next action.

## Coexistence with PAUL

Forge does not modify PAUL. If you have `paul-framework` installed, both frameworks coexist. Forge uses `/forge:*` commands and `.forge/` state; PAUL continues to own `/paul:*` and `.paul/`.

## Relationship to PAUL

Forge is a verbatim clone of `paul-framework@1.2.0` with three subsystems layered on top. Every command that exists in PAUL is available in forge under the same name with `forge:` prefix. The core `plan → apply → unify` loop mechanics, templates, and rules are identical — forge only adds new capability on top, never replaces or diverges from PAUL's core patterns.

Credit to [Chris Kahler](https://github.com/ChristopherKahler) for the original PAUL framework that forge is built from.

## License

MIT
