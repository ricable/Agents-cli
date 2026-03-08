---
name: SWE-agent
version: 0.0.0
description: "CLI tool: SWE-agent. Use this skill when working with SWE-agent-related tasks."
ingredients:
  - princeton-nlp/SWE-agent
tags:
  - cli
---

# SWE-agent

CLI tool: SWE-agent

## Usage

```bash
# Show help
SWE-agent --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run SWE-agent -- --help --json

# Introspect command schema
agents-cli schema SWE-agent --json

# Dry-run before executing
agents-cli run SWE-agent -- <args> --dry-run
```
