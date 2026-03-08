---
name: AgentGPT
version: 0.0.0
description: "CLI tool: AgentGPT. Use this skill when working with AgentGPT-related tasks."
ingredients:
  - reworkd/AgentGPT
tags:
  - cli
---

# AgentGPT

CLI tool: AgentGPT

## Usage

```bash
# Show help
AgentGPT --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run AgentGPT -- --help --json

# Introspect command schema
agents-cli schema AgentGPT --json

# Dry-run before executing
agents-cli run AgentGPT -- <args> --dry-run
```
