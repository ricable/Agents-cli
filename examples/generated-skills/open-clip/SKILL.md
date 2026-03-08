---
name: open_clip
version: 0.0.0
description: "CLI tool: open_clip. Use this skill when working with open_clip-related tasks."
ingredients:
  - mlfoundations/open_clip
tags:
  - cli
---

# open_clip

CLI tool: open_clip

## Usage

```bash
# Show help
open_clip --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run open_clip -- --help --json

# Introspect command schema
agents-cli schema open_clip --json

# Dry-run before executing
agents-cli run open_clip -- <args> --dry-run
```
