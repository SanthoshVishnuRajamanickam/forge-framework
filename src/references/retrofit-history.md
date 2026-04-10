<overview>
Reference for the retrofit history analysis agent. Defines git commands, parsing
strategies, edge case handling, and output format for reverse-engineering FORGE
state from an existing project's git history.

This document is loaded by the history agent (Agent 5) during `/forge:retrofit`.
The history agent runs as a **haiku or sonnet model** subagent to minimize token
cost, since the work is mostly git command execution and structured output.
</overview>

<data_sources>

## Source Priority Order

Parse these in order. Higher-priority sources override lower ones.

| Priority | Source | What it tells you | Reliability |
|----------|--------|-------------------|-------------|
| 1 | CHANGELOG.md / HISTORY.md | Milestones, features, dates | HIGH — human-curated |
| 2 | Git tags (annotated) | Version boundaries, release notes | HIGH — explicit markers |
| 3 | Git tags (lightweight) | Version boundaries only | MEDIUM — no context |
| 4 | PR/merge commit messages | Feature groupings, scope | MEDIUM — varies by team |
| 5 | Conventional commit messages | Feature names, types | MEDIUM — if team follows convention |
| 6 | File creation timeline | Phase clusters by directory | LOW — indirect signal |
| 7 | Commit message free text | Ad-hoc feature mentions | LOW — noisy |

**Rule:** If CHANGELOG exists and is parseable, use it as ground truth for
milestones and features. Only fall back to git log analysis when no structured
docs exist.

</data_sources>

<git_commands>

## Git Commands Reference

### Stage 1: Metadata scan (always run, <200K tokens)

```bash
# Project identity
git describe --tags --always 2>/dev/null
git rev-list --count HEAD
git log --reverse --format="%ai" -1          # repo birthday
git log --format="%ai" -1                     # latest commit

# All tags with dates and annotations
git tag -l --sort=-version:refname --format="%(refname:short) %(creatordate:iso) %(contents:lines=1)" | head -30

# Full commit metadata (no diffs — cheap)
git log --format="%h %ai %ae %s" --all       # hash, date, author, subject

# Conventional commit detection
git log --format="%s" -500 | grep -cE "^(feat|fix|chore|docs|refactor|test|perf|ci|build)\b"

# Bot commit detection
git log --format="%ae" | grep -cE "(bot|dependabot|renovate|semantic-release|github-actions)"

# Branch topology
git branch -r --list 2>/dev/null | head -20

# Contributors
git shortlog -sn --no-merges --all | head -15

# Existing documentation
ls README* CHANGELOG* HISTORY* CHANGES* RELEASE* VERSIONS* docs/ 2>/dev/null
```

### Stage 2: Tag-range analysis (per milestone, on demand)

```bash
# Commits between consecutive tags
git log v1.0..v1.1 --oneline
git log v1.0..v1.1 --format="%h %ae %s" --name-only

# File impact per range
git diff v1.0..v1.1 --stat | tail -1         # summary: N files, +X, -Y

# Tag annotation (if annotated)
git tag -l --format="%(contents)" v1.1
```

### Stage 3: Deep analysis (full mode only, expensive)

```bash
# File creation timeline for phase clustering
git log --diff-filter=A --name-only --format="===%ai===" -- '*.ts' '*.js' '*.py' '*.rs' '*.go' '*.c' '*.cpp' '*.java' '*.kt' '*.swift' | head -500

# Historical PLAN.md / ROADMAP.md archaeology
git log --all --follow --pretty=format:"%h %ai %s" -- "PLAN.md" "ROADMAP.md" ".forge/PLAN.md" "docs/PLAN.md" 2>/dev/null

# PR metadata (if GitHub CLI available)
gh api repos/{owner}/{repo}/pulls --state=closed --paginate --jq '.[].{number,title,merged_at,merge_commit_sha}' 2>/dev/null | head -100
```

</git_commands>

<pre_processing>

## Pre-Processing Gates

Run these BEFORE history analysis to avoid garbage-in-garbage-out.

### 1. Bot Filter

Detect and exclude bot commits from feature analysis.

```bash
# Known bot patterns
BOT_PATTERNS="dependabot\[bot\]|renovate\[bot\]|semantic-release|github-actions\[bot\]|greenkeeper\[bot\]|snyk-bot|imgbot\[bot\]|codecov\[bot\]"

# Count bot commits
BOT_COUNT=$(git log --format="%ae" --all | grep -cE "$BOT_PATTERNS")
TOTAL_COUNT=$(git rev-list --count --all)
BOT_PCT=$((BOT_COUNT * 100 / TOTAL_COUNT))

# Report
echo "Bot commits: $BOT_COUNT / $TOTAL_COUNT ($BOT_PCT%)"
```

Exclude bot commits from all feature extraction. Report bot percentage separately.

### 2. Fork Point Detection

Detect if this repo was forked from another project.

Signals:
- Author diversity drops sharply at a commit (upstream has 50 authors, fork has 3)
- Large structural shift (new `src/app/` directory appears after 1000 commits of `lib/`)
- Commit message contains "fork", "clone", "import from", "migrate from"
- `git remote -v` shows an `upstream` remote

If detected, ask user: "Detected potential fork point at [commit/date]. Start retrofit from here? [y/n]"
If confirmed, scope all subsequent git commands with `--since=[fork_date]` or `[fork_hash]..HEAD`.

### 3. Sensitive Data Scanner

Before writing ANY `.forge/` file, scan extracted text for:

```
# Patterns to detect
JIRA-\d+, [A-Z]{2,10}-\d+          # ticket references
@company\.com                        # internal emails
customer|client followed by names    # customer references
password|secret|token|api.key        # secrets (should never be in commits, but check)
```

If found, prompt user:
```
⚠ Found potentially sensitive data in extracted history:
  - 8 JIRA ticket references (e.g. "AUTH-1234")
  - 3 internal email addresses
  
Options:
  [1] Redact all (replace with [internal-ref], [team-member])
  [2] Review each one
  [3] Keep as-is (I'll review before committing)
```

</pre_processing>

<workflow_strategies>

## Workflow-Specific Strategies

### Standard (branches + tags + PRs)

Default strategy. Works for ~70% of projects.

1. Parse CHANGELOG (if exists) → milestones + features
2. Parse tags → milestone boundaries
3. Between each tag pair: cluster commits by conventional prefix or file directory
4. Name phases from: commit subjects, directory names, PR titles
5. Confidence: HIGH for tagged milestones, MEDIUM for inferred phases

### Squash-Merge Projects

Each commit on main = one PR = one feature.

1. Detect: >50% of commits match "Merge pull request" or have single-parent merges
2. Strategy: treat each main-branch commit as a feature unit
3. Group features into milestones by tag ranges
4. If GitHub CLI available: fetch PR titles and descriptions for richer feature names
5. Phase clustering: group PRs by directory impact or label
6. Confidence: MEDIUM (depends on PR title quality)

### Trunk-Based / Feature Flag Projects

No branches, no tags per feature. Hardest case.

1. Detect: single branch (main only), no feature branches, frequent small commits
2. Strategy: cannot auto-detect features — CHANGELOG is the only reliable source
3. If no CHANGELOG: ask user to provide milestone boundaries manually
4. Offer: "List your major releases/versions with approximate dates"
5. Fall back to time-based chunking (quarterly milestones) as last resort
6. Confidence: LOW — always flag for user review

### Rebase-Heavy Projects

Linear history, commit hashes unreliable.

1. Detect: no merge commits, linear graph (`git log --merges | wc -l` == 0)
2. Strategy: never store commit hashes in MILESTONES.md
3. Use tag names + dates for milestone ranges (tags survive rebases)
4. For untagged work: use date ranges ("2024-03 to 2024-06")
5. Confidence: MEDIUM for tagged ranges, LOW for untagged

### Multi-Branch Release Model

Parallel release lines (e.g. v1.x LTS + v2.x current).

1. Detect: tags on multiple branches, release/* branch pattern
2. Strategy: scan all branches with `git tag --merged` per branch
3. Present as separate milestone tracks: "v1.x (LTS): 3 releases" / "v2.x: 5 releases"
4. Ask user: "Retrofit as (A) unified timeline or (B) separate tracks?"
5. Confidence: MEDIUM (branch topology is explicit but relationships aren't)

</workflow_strategies>

<output_format>

## History Agent Output Format

The history agent returns a structured intermediate format that the retrofit
workflow's synthesis step consumes.

```yaml
history_analysis:
  metadata:
    project_name: "my-app"                 # from package.json or directory
    current_version: "2.1.0"               # from git describe
    repo_birthday: "2024-01-15"            # first commit date
    latest_activity: "2026-04-08"          # last commit date
    total_commits: 847
    bot_commits: 120
    human_commits: 727
    contributors: 4
    conventional_commit_pct: 68            # % following conventional format
    workflow_type: "standard"              # standard | squash | trunk | rebase | multi-release
    has_changelog: true
    changelog_path: "CHANGELOG.md"
    fork_point: null                       # commit hash or null
    sensitive_data_found: false

  milestones:
    - version: "v1.0.0"
      date: "2024-03-20"
      tag_annotation: "Initial public release"
      commit_count: 142
      file_count: 47
      confidence: "high"                   # high | medium | low
      source: "tag + changelog"            # what data backed this inference
      phases:
        - name: "Authentication"
          commit_range: "abc123..def456"   # or date range for rebase projects
          commit_count: 38
          key_files: ["src/auth/", "src/middleware/"]
          features:
            - "User registration + login"
            - "JWT token management"
            - "Password reset flow"
          confidence: "high"
          source: "conventional commits + directory clustering"
        - name: "API Layer"
          # ...

    - version: "v2.0.0"
      # ...

  current_state:
    version: "2.1.0"
    status: "active"                       # active | maintenance | dormant
    commits_since_last_tag: 24
    active_branches: ["main", "feat/mobile-app"]
    in_progress_features:
      - "Mobile app integration"           # inferred from active branches
      - "Performance optimization"

  key_decisions:
    - date: "2024-06-15"
      decision: "Migrated from Express to Fastify"
      evidence: "package.json diff at v1.1.0"
    - date: "2025-01-08"
      decision: "Switched from REST to GraphQL"
      evidence: "src/graphql/ directory created, src/routes/ deprecated"

  health:
    commit_frequency: "3.2/week"           # average over last 6 months
    test_file_ratio: 0.34                  # test files / source files
    trend: "stable"                        # growing | stable | declining
```

</output_format>

<edge_cases>

## Edge Case Handling

| Scenario | Detection | Strategy |
|----------|-----------|----------|
| No tags | `git tag -l` returns empty | Single milestone "v0.1.0", ask user for version |
| No conventional commits | <10% conventional | Rely on CHANGELOG + file timeline |
| Single commit repo | `git rev-list --count HEAD` == 1 | Redirect to `/forge:init` |
| >10K commits | `git rev-list --count HEAD` > 10000 | Stage 1 only (metadata), sample Stage 2 |
| No CHANGELOG | `ls CHANGELOG*` empty | Full git analysis, lower confidence |
| SVN import | Commit messages contain `git-svn-id` | Warn user, ask for real start point |
| Submodules | `.gitmodules` exists | Analyze parent only, note submodules in report |
| Monorepo | Multiple package manifests at different paths | Ask user which package, scope with `-- path/` |
| <100 commits | `git rev-list --count HEAD` < 100 | Suggest `/forge:init` instead (faster, cheaper) |

</edge_cases>
