---
name: Qwen-Agent
version: 0.0.0
description: "CLI tool: Qwen-Agent. Use this skill when working with Qwen-Agent-related tasks."
ingredients:
  - QwenLM/Qwen-Agent
tags:
  - cli
---

# Qwen-Agent

CLI tool: Qwen-Agent

## Usage

```bash
# Show help
Qwen-Agent --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run Qwen-Agent -- --help --json

# Introspect command schema
agents-cli schema Qwen-Agent --json

# Dry-run before executing
agents-cli run Qwen-Agent -- <args> --dry-run
```
