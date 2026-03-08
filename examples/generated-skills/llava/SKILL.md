---
name: LLaVA
version: 0.0.0
description: "CLI tool: LLaVA. Use this skill when working with LLaVA-related tasks."
ingredients:
  - haotian-liu/LLaVA
tags:
  - cli
---

# LLaVA

CLI tool: LLaVA

## Usage

```bash
# Show help
LLaVA --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run LLaVA -- --help --json

# Introspect command schema
agents-cli schema LLaVA --json

# Dry-run before executing
agents-cli run LLaVA -- <args> --dry-run
```
