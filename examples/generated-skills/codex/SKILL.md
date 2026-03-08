---
name: codex
version: 0.0.0
description: "Lightweight coding agent that runs in your terminal. Use this skill when working with codex-related tasks."
ingredients:
  - openai/codex
tags:
  - cli
# homepage: https://github.com/openai/codex
# license: Apache-2.0
---

# codex

Lightweight coding agent that runs in your terminal

**Source**: https://github.com/openai/codex

## Usage

```bash
# Show help
codex --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run codex -- --help --json

# Introspect command schema
agents-cli schema codex --json

# Dry-run before executing
agents-cli run codex -- <args> --dry-run
```
