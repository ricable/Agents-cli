---
name: annoy
version: 0.0.0
description: "CLI tool: annoy. Use this skill when working with annoy-related tasks."
ingredients:
  - spotify/annoy
tags:
  - cli
---

# annoy

CLI tool: annoy

## Usage

```bash
# Show help
annoy --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run annoy -- --help --json

# Introspect command schema
agents-cli schema annoy --json

# Dry-run before executing
agents-cli run annoy -- <args> --dry-run
```
