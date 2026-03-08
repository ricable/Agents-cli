---
name: featureform
version: 0.0.0
description: "CLI tool: featureform. Use this skill when working with featureform-related tasks."
ingredients:
  - featureform/featureform
tags:
  - cli
---

# featureform

CLI tool: featureform

## Usage

```bash
# Show help
featureform --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run featureform -- --help --json

# Introspect command schema
agents-cli schema featureform --json

# Dry-run before executing
agents-cli run featureform -- <args> --dry-run
```
