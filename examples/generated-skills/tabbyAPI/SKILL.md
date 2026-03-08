---
name: tabbyAPI
version: 0.0.0
description: "The official API server for Exllama. OAI compatible, lightweight, and fast.. Use this skill when working with tabbyAPI-related tasks."
ingredients:
  - theroyallab/tabbyAPI
tags:
  - cli
# homepage: https://github.com/theroyallab/tabbyAPI
# license: AGPL-3.0
---

# tabbyAPI

The official API server for Exllama. OAI compatible, lightweight, and fast.

**Source**: https://github.com/theroyallab/tabbyAPI

## Usage

```bash
# Show help
tabbyAPI --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run tabbyAPI -- --help --json

# Introspect command schema
agents-cli schema tabbyAPI --json

# Dry-run before executing
agents-cli run tabbyAPI -- <args> --dry-run
```
