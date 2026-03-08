---
name: mmsegmentation
version: 0.0.0
description: "CLI tool: mmsegmentation. Use this skill when working with mmsegmentation-related tasks."
ingredients:
  - open-mmlab/mmsegmentation
tags:
  - cli
---

# mmsegmentation

CLI tool: mmsegmentation

## Usage

```bash
# Show help
mmsegmentation --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run mmsegmentation -- --help --json

# Introspect command schema
agents-cli schema mmsegmentation --json

# Dry-run before executing
agents-cli run mmsegmentation -- <args> --dry-run
```
