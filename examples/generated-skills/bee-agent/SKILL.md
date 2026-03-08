---
name: bee-agent-framework
version: 0.0.0
description: "CLI tool: bee-agent-framework. Use this skill when working with bee-agent-framework-related tasks."
ingredients:
  - i-am-bee/bee-agent-framework
tags:
  - cli
---

# bee-agent-framework

CLI tool: bee-agent-framework

## Usage

```bash
# Show help
bee-agent-framework --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run bee-agent-framework -- --help --json

# Introspect command schema
agents-cli schema bee-agent-framework --json

# Dry-run before executing
agents-cli run bee-agent-framework -- <args> --dry-run
```
