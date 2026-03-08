---
name: nvitop
version: 0.0.0
description: "CLI tool: nvitop. Use this skill when working with nvitop-related tasks."
ingredients:
  - XuehaiPan/nvitop
tags:
  - cli
---

# nvitop

CLI tool: nvitop

## Usage

```bash
# Show help
nvitop --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run nvitop -- --help --json

# Introspect command schema
agents-cli schema nvitop --json

# Dry-run before executing
agents-cli run nvitop -- <args> --dry-run
```
