---
name: albumentations
version: 0.0.0
description: "CLI tool: albumentations. Use this skill when working with albumentations-related tasks."
ingredients:
  - albumentations-team/albumentations
tags:
  - cli
---

# albumentations

CLI tool: albumentations

## Usage

```bash
# Show help
albumentations --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run albumentations -- --help --json

# Introspect command schema
agents-cli schema albumentations --json

# Dry-run before executing
agents-cli run albumentations -- <args> --dry-run
```
