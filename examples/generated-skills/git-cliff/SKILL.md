---
name: git-cliff
version: 0.0.0
description: "CLI tool: git-cliff. Use this skill when working with git-cliff-related tasks."
ingredients:
  - orhun/git-cliff
tags:
  - cli
---

# git-cliff

CLI tool: git-cliff

## Usage

```bash
# Show help
git-cliff --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run git-cliff -- --help --json

# Introspect command schema
agents-cli schema git-cliff --json

# Dry-run before executing
agents-cli run git-cliff -- <args> --dry-run
```
