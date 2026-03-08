---
name: great_expectations
version: 0.0.0
description: "CLI tool: great_expectations. Use this skill when working with great_expectations-related tasks."
ingredients:
  - great-expectations/great_expectations
tags:
  - cli
---

# great_expectations

CLI tool: great_expectations

## Usage

```bash
# Show help
great_expectations --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run great_expectations -- --help --json

# Introspect command schema
agents-cli schema great_expectations --json

# Dry-run before executing
agents-cli run great_expectations -- <args> --dry-run
```
