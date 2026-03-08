---
name: swarm
version: 0.0.0
description: "CLI tool: swarm. Use this skill when working with swarm-related tasks."
ingredients:
  - openai/swarm
tags:
  - cli
---

# swarm

CLI tool: swarm

## Usage

```bash
# Show help
swarm --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run swarm -- --help --json

# Introspect command schema
agents-cli schema swarm --json

# Dry-run before executing
agents-cli run swarm -- <args> --dry-run
```
