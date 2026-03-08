---
name: ultralytics
version: 0.0.0
description: "CLI tool: ultralytics. Use this skill when working with ultralytics-related tasks."
ingredients:
  - ultralytics/ultralytics
tags:
  - cli
---

# ultralytics

CLI tool: ultralytics

## Usage

```bash
# Show help
ultralytics --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run ultralytics -- --help --json

# Introspect command schema
agents-cli schema ultralytics --json

# Dry-run before executing
agents-cli run ultralytics -- <args> --dry-run
```
