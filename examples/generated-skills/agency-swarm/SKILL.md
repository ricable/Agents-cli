---
name: agency-swarm
version: 1.8.0
description: "CLI tool: agency-swarm. Use this skill when working with agency-swarm-related tasks."
ingredients:
  - VRSEN/agency-swarm
tags:
  - cli
---

# agency-swarm

CLI tool: agency-swarm

## Usage

```bash
# Show help
agency-swarm --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run agency-swarm -- --help --json

# Introspect command schema
agents-cli schema agency-swarm --json

# Dry-run before executing
agents-cli run agency-swarm -- <args> --dry-run
```
