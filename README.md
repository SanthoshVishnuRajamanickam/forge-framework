# Forge Framework

**Autonomous Engineering on PAUL patterns** — PRD intake, self-healing plan/apply/verify/unify loop, and dynamic stack adapters. Built on top of [PAUL](https://github.com/ChristopherKahler/paul)'s Plan-Apply-Unify loop.

```bash
npx forge-framework
```

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

## Coexistence with PAUL

Forge does not modify PAUL. If you have `paul-framework` installed, both frameworks coexist. Forge uses `/forge:*` commands and `.forge/` state; PAUL continues to own `/paul:*` and `.paul/`.

## Relationship to PAUL

Forge is a verbatim clone of `paul-framework@1.2.0` with three subsystems layered on top. Every command that exists in PAUL is available in forge under the same name with `forge:` prefix. The core `plan → apply → unify` loop mechanics, templates, and rules are identical — forge only adds new capability on top, never replaces or diverges from PAUL's core patterns.

Credit to [Chris Kahler](https://github.com/ChristopherKahler) for the original PAUL framework that forge is built from.

## License

MIT
