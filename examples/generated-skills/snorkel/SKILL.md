---
name: snorkel
version: 0.0.0
description: "CLI tool: snorkel. Use this skill when working with snorkel-related tasks."
ingredients:
  - snorkel-team/snorkel
tags:
  - cli
---

# snorkel

CLI tool: snorkel

## Usage

```bash
# Show help
snorkel --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run snorkel -- --help --json

# Introspect command schema
agents-cli schema snorkel --json

# Dry-run before executing
agents-cli run snorkel -- <args> --dry-run
```
