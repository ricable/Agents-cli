---
name: pytorch-lightning
version: 0.0.0
description: "CLI tool: pytorch-lightning. Use this skill when working with pytorch-lightning-related tasks."
ingredients:
  - Lightning-AI/pytorch-lightning
tags:
  - cli
---

# pytorch-lightning

CLI tool: pytorch-lightning

## Usage

```bash
# Show help
pytorch-lightning --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run pytorch-lightning -- --help --json

# Introspect command schema
agents-cli schema pytorch-lightning --json

# Dry-run before executing
agents-cli run pytorch-lightning -- <args> --dry-run
```
