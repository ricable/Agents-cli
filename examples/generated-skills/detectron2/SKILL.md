---
name: detectron2
version: 0.0.0
description: "CLI tool: detectron2. Use this skill when working with detectron2-related tasks."
ingredients:
  - facebookresearch/detectron2
tags:
  - cli
---

# detectron2

CLI tool: detectron2

## Usage

```bash
# Show help
detectron2 --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run detectron2 -- --help --json

# Introspect command schema
agents-cli schema detectron2 --json

# Dry-run before executing
agents-cli run detectron2 -- <args> --dry-run
```
