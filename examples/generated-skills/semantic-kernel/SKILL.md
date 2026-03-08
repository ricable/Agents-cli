---
name: semantic-kernel
version: 0.0.0
description: "CLI tool: semantic-kernel. Use this skill when working with semantic-kernel-related tasks."
ingredients:
  - microsoft/semantic-kernel
tags:
  - cli
---

# semantic-kernel

CLI tool: semantic-kernel

## Usage

```bash
# Show help
semantic-kernel --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run semantic-kernel -- --help --json

# Introspect command schema
agents-cli schema semantic-kernel --json

# Dry-run before executing
agents-cli run semantic-kernel -- <args> --dry-run
```
