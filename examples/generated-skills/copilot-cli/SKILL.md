---
name: gh-copilot
version: 0.0.0
description: "CLI tool: gh-copilot. Use this skill when working with gh-copilot-related tasks."
ingredients:
  - github/gh-copilot
tags:
  - cli
---

# gh-copilot

CLI tool: gh-copilot

## Usage

```bash
# Show help
gh-copilot --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run gh-copilot -- --help --json

# Introspect command schema
agents-cli schema gh-copilot --json

# Dry-run before executing
agents-cli run gh-copilot -- <args> --dry-run
```
