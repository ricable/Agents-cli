---
name: wandb
version: 0.0.0
description: "CLI tool: wandb. Use this skill when working with wandb-related tasks."
ingredients:
  - wandb/wandb
tags:
  - cli
---

# wandb

CLI tool: wandb

## Usage

```bash
# Show help
wandb --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run wandb -- --help --json

# Introspect command schema
agents-cli schema wandb --json

# Dry-run before executing
agents-cli run wandb -- <args> --dry-run
```
