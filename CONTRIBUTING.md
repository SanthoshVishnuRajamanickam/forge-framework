# Contributing to Forge

Thanks for your interest in forge-framework. This project is a thin layer on
top of [PAUL](https://github.com/ChristopherKahler/paul) — changes should
respect that boundary.

## Ground rules

- **Don't diverge from PAUL's core loop.** If a change would touch
  `plan → apply → unify` semantics, raise an issue first so we can decide
  whether it belongs in forge or upstream in PAUL.
- **Keep additions modular.** New capability lives in its own workflow and
  command. We don't edit PAUL-clone workflows except to fix bugs.
- **Templates over code.** Forge is a prompt framework. Most contributions
  are markdown: new commands, workflows, references, or templates.

## Development setup

```bash
git clone https://github.com/santhoshvishnu/forge-framework.git
cd forge-framework
npm install                     # no runtime deps; just the installer
node bin/install.js --local     # smoke test the installer into ./.claude
```

To test a change end-to-end, run `node bin/install.js --global` from your
working copy and then use `/forge:*` inside Claude Code.

## Pull requests

1. Branch from `main`.
2. Keep the change focused — one feature or one fix per PR.
3. Update `HISTORY.md` with a short entry.
4. Run `node bin/install.js --local` and confirm the installer completes
   cleanly.
5. If you added a command, make sure `src/commands/help.md` lists it and the
   command count at the bottom matches `ls src/commands | wc -l`.

## Reporting bugs

Open an issue with:
- What you ran (`/forge:*` command + args)
- What you expected
- What actually happened (paste the debug file if one was generated)
- `forge-framework` version (`cat ~/.claude/forge-framework/VERSION` or
  `npm view forge-framework version`)
