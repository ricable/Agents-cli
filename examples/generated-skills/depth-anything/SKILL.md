---
name: Depth-Anything
version: 0.0.0
description: "CLI tool: Depth-Anything. Use this skill when working with Depth-Anything-related tasks."
ingredients:
  - LiheYoung/Depth-Anything
tags:
  - cli
---

# Depth-Anything

CLI tool: Depth-Anything

## Usage

```bash
# Show help
Depth-Anything --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run Depth-Anything -- --help --json

# Introspect command schema
agents-cli schema Depth-Anything --json

# Dry-run before executing
agents-cli run Depth-Anything -- <args> --dry-run
```
