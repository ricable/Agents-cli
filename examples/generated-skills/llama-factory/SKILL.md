---
name: LLaMA-Factory
version: 0.0.0
description: "CLI tool: LLaMA-Factory. Use this skill when working with LLaMA-Factory-related tasks."
ingredients:
  - hiyouga/LLaMA-Factory
tags:
  - cli
---

# LLaMA-Factory

CLI tool: LLaMA-Factory

## Usage

```bash
# Show help
LLaMA-Factory --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run LLaMA-Factory -- --help --json

# Introspect command schema
agents-cli schema LLaMA-Factory --json

# Dry-run before executing
agents-cli run LLaMA-Factory -- <args> --dry-run
```
