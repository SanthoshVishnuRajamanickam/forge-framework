# CARL — Context-Anchored Rule Loader

CARL is FORGE's rule manifest. It's a flat key-value file (`FORGE`) read by the
framework at session start to enforce invariants across every `/forge:*`
command.

## Files

- **`FORGE`** — the active rule set. Each line is a single invariant.
- **`FORGE.manifest`** — metadata (version, checksum, rule count) used to
  detect drift between installs.

## How rules are enforced

Rules are loaded as part of the command preamble. `FORGE_RULE_1` — the
"LOAD BEFORE EXECUTE" rule — requires Claude to Read the command file and its
linked workflow *before* executing, which guarantees every other rule is
evaluated against the current on-disk workflow rather than model memory.

Rules are grouped by RFC 2119 level:

| Level | Rules | Meaning |
|-------|-------|---------|
| MUST  | 1–6   | Critical. Violation = stop. |
| SHOULD| 7–9   | Quality. Violation = warn + continue. |
| MAY   | 10–12 | Patterns. Guidance, not blocking. |

## Extending CARL

1. Add a new `FORGE_RULE_N=...` line to `FORGE`. Keep the wording imperative
   and single-sentence.
2. Bump the rule count in `FORGE.manifest`.
3. Reference the rule from the workflow(s) it governs so Claude sees it in
   context when the rule becomes relevant.

## Why a flat file and not JSON?

CARL is read by an LLM, not a parser. Flat key=value lines survive partial
context loads, diff cleanly in git, and are trivial to grep when debugging
why a rule fired.
