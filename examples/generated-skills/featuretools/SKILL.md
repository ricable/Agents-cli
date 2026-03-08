---
name: featuretools
version: 0.0.0
description: "CLI tool: featuretools. Use this skill when working with featuretools-related tasks."
ingredients:
  - alteryx/featuretools
tags:
  - cli
---

# featuretools

CLI tool: featuretools

## Usage

```bash
# Show help
featuretools --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run featuretools -- --help --json

# Introspect command schema
agents-cli schema featuretools --json

# Dry-run before executing
agents-cli run featuretools -- <args> --dry-run
```
