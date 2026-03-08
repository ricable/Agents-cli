---
name: ControlNet
version: 0.0.0
description: "CLI tool: ControlNet. Use this skill when working with ControlNet-related tasks."
ingredients:
  - lllyasviel/ControlNet
tags:
  - cli
---

# ControlNet

CLI tool: ControlNet

## Usage

```bash
# Show help
ControlNet --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run ControlNet -- --help --json

# Introspect command schema
agents-cli schema ControlNet --json

# Dry-run before executing
agents-cli run ControlNet -- <args> --dry-run
```
