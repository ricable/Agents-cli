---
name: Awesome-Text2SQL
version: 0.0.0
description: "CLI tool: Awesome-Text2SQL. Use this skill when working with Awesome-Text2SQL-related tasks."
ingredients:
  - eosphoros-ai/Awesome-Text2SQL
tags:
  - cli
---

# Awesome-Text2SQL

CLI tool: Awesome-Text2SQL

## Usage

```bash
# Show help
Awesome-Text2SQL --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run Awesome-Text2SQL -- --help --json

# Introspect command schema
agents-cli schema Awesome-Text2SQL --json

# Dry-run before executing
agents-cli run Awesome-Text2SQL -- <args> --dry-run
```
