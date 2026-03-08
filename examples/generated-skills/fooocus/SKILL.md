---
name: Fooocus
version: 0.0.0
description: "CLI tool: Fooocus. Use this skill when working with Fooocus-related tasks."
ingredients:
  - lllyasviel/Fooocus
tags:
  - cli
---

# Fooocus

CLI tool: Fooocus

## Usage

```bash
# Show help
Fooocus --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run Fooocus -- --help --json

# Introspect command schema
agents-cli schema Fooocus --json

# Dry-run before executing
agents-cli run Fooocus -- <args> --dry-run
```
