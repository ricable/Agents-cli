---
name: spaCy
version: 0.0.0
description: "CLI tool: spaCy. Use this skill when working with spaCy-related tasks."
ingredients:
  - explosion/spaCy
tags:
  - cli
---

# spaCy

CLI tool: spaCy

## Usage

```bash
# Show help
spaCy --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run spaCy -- --help --json

# Introspect command schema
agents-cli schema spaCy --json

# Dry-run before executing
agents-cli run spaCy -- <args> --dry-run
```
