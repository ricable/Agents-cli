---
name: nbconvert
version: 0.0.0
description: "CLI tool: nbconvert. Use this skill when working with nbconvert-related tasks."
ingredients:
  - jupyter/nbconvert
tags:
  - cli
---

# nbconvert

CLI tool: nbconvert

## Usage

```bash
# Show help
nbconvert --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run nbconvert -- --help --json

# Introspect command schema
agents-cli schema nbconvert --json

# Dry-run before executing
agents-cli run nbconvert -- <args> --dry-run
```
