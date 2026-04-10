# Contributing to Forge

Thanks for your interest in forge-framework.

## Ground rules

- **Keep additions modular.** New capability lives in its own workflow and
  command. Don't edit core loop workflows unless fixing a bug.
- **Templates over code.** Forge is a prompt framework. Most contributions
  are markdown: new commands, workflows, references, or templates.
- **Test what you add.** If you add a command, make sure `src/commands/help.md`
  lists it and the count matches.

## Development setup

```bash
git clone https://github.com/santhoshvishnu-sketch/forge-framework.git
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
- `forge-framework` version (`npm view forge-framework version`)
