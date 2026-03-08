---
name: smolagents
version: 0.0.0
description: "CLI tool: smolagents. Use this skill when working with smolagents-related tasks."
ingredients:
  - huggingface/smolagents
tags:
  - cli
---

# smolagents

CLI tool: smolagents

## Usage

```bash
# Show help
smolagents --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run smolagents -- --help --json

# Introspect command schema
agents-cli schema smolagents --json

# Dry-run before executing
agents-cli run smolagents -- <args> --dry-run
```
