---
name: lm-evaluation-harness
version: 0.0.0
description: "CLI tool: lm-evaluation-harness. Use this skill when working with lm-evaluation-harness-related tasks."
ingredients:
  - EleutherAI/lm-evaluation-harness
tags:
  - cli
---

# lm-evaluation-harness

CLI tool: lm-evaluation-harness

## Usage

```bash
# Show help
lm-evaluation-harness --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run lm-evaluation-harness -- --help --json

# Introspect command schema
agents-cli schema lm-evaluation-harness --json

# Dry-run before executing
agents-cli run lm-evaluation-harness -- <args> --dry-run
```
