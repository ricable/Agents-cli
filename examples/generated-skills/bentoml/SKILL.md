---
name: BentoML
version: 0.0.0
description: "CLI tool: BentoML. Use this skill when working with BentoML-related tasks."
ingredients:
  - bentoml/BentoML
tags:
  - cli
---

# BentoML

CLI tool: BentoML

## Usage

```bash
# Show help
BentoML --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run BentoML -- --help --json

# Introspect command schema
agents-cli schema BentoML --json

# Dry-run before executing
agents-cli run BentoML -- <args> --dry-run
```
