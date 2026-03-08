---
name: rivet
version: 0.0.0
description: "CLI tool: rivet. Use this skill when working with rivet-related tasks."
ingredients:
  - Ironclad/rivet
tags:
  - cli
---

# rivet

CLI tool: rivet

## Usage

```bash
# Show help
rivet --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run rivet -- --help --json

# Introspect command schema
agents-cli schema rivet --json

# Dry-run before executing
agents-cli run rivet -- <args> --dry-run
```
