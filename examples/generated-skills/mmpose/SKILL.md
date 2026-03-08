---
name: mmpose
version: 0.0.0
description: "CLI tool: mmpose. Use this skill when working with mmpose-related tasks."
ingredients:
  - open-mmlab/mmpose
tags:
  - cli
---

# mmpose

CLI tool: mmpose

## Usage

```bash
# Show help
mmpose --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run mmpose -- --help --json

# Introspect command schema
agents-cli schema mmpose --json

# Dry-run before executing
agents-cli run mmpose -- <args> --dry-run
```
