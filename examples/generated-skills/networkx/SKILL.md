---
name: networkx
version: 0.0.0
description: "CLI tool: networkx. Use this skill when working with networkx-related tasks."
ingredients:
  - networkx/networkx
tags:
  - cli
---

# networkx

CLI tool: networkx

## Usage

```bash
# Show help
networkx --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run networkx -- --help --json

# Introspect command schema
agents-cli schema networkx --json

# Dry-run before executing
agents-cli run networkx -- <args> --dry-run
```
