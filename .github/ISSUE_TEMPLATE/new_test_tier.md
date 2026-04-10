---
name: New Test Tier / Executor
about: Propose a new test tier or executor binding
title: "[Test] "
labels: test-flows
assignees: ''
---

## What tier or executor?

<!-- e.g. "accessibility tier", "Appium MCP executor", "k6 CLI executor" -->

## What project type needs this?

<!-- e.g. mobile apps, web apps, embedded -->

## Proposed executor config

```yaml
tier_name:
  enabled: true
  executors:
    - name: "..."
      type: cli | skill | mcp | manual
      # ...
```

## Would you be willing to contribute this?

- [ ] Yes, I'd submit a PR with the reference doc + template changes
- [ ] Just proposing the idea
