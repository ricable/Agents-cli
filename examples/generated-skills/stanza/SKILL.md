---
name: stanza
version: 0.0.0
description: "CLI tool: stanza. Use this skill when working with stanza-related tasks."
ingredients:
  - stanfordnlp/stanza
tags:
  - cli
---

# stanza

CLI tool: stanza

## Usage

```bash
# Show help
stanza --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run stanza -- --help --json

# Introspect command schema
agents-cli schema stanza --json

# Dry-run before executing
agents-cli run stanza -- <args> --dry-run
```
