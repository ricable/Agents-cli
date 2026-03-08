---
name: CLIP
version: 0.0.0
description: "CLI tool: CLIP. Use this skill when working with CLIP-related tasks."
ingredients:
  - openai/CLIP
tags:
  - cli
---

# CLIP

CLI tool: CLIP

## Usage

```bash
# Show help
CLIP --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run CLIP -- --help --json

# Introspect command schema
agents-cli schema CLIP --json

# Dry-run before executing
agents-cli run CLIP -- <args> --dry-run
```
