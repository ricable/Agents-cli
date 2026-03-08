---
name: GroundingDINO
version: 0.0.0
description: "CLI tool: GroundingDINO. Use this skill when working with GroundingDINO-related tasks."
ingredients:
  - IDEA-Research/GroundingDINO
tags:
  - cli
---

# GroundingDINO

CLI tool: GroundingDINO

## Usage

```bash
# Show help
GroundingDINO --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run GroundingDINO -- --help --json

# Introspect command schema
agents-cli schema GroundingDINO --json

# Dry-run before executing
agents-cli run GroundingDINO -- <args> --dry-run
```
