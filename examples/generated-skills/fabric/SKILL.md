---
name: fabric
version: 0.0.0
description: "CLI tool: fabric. Use this skill when working with fabric-related tasks."
ingredients:
  - danielmiessler/fabric
tags:
  - cli
---

# fabric

CLI tool: fabric

## Usage

```bash
# Show help
fabric --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run fabric -- --help --json

# Introspect command schema
agents-cli schema fabric --json

# Dry-run before executing
agents-cli run fabric -- <args> --dry-run
```
