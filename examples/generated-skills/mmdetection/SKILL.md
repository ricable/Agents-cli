---
name: mmdetection
version: 0.0.0
description: "CLI tool: mmdetection. Use this skill when working with mmdetection-related tasks."
ingredients:
  - open-mmlab/mmdetection
tags:
  - cli
---

# mmdetection

CLI tool: mmdetection

## Usage

```bash
# Show help
mmdetection --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run mmdetection -- --help --json

# Introspect command schema
agents-cli schema mmdetection --json

# Dry-run before executing
agents-cli run mmdetection -- <args> --dry-run
```
