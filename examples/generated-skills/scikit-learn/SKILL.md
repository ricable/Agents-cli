---
name: scikit-learn
version: 0.0.0
description: "CLI tool: scikit-learn. Use this skill when working with scikit-learn-related tasks."
ingredients:
  - scikit-learn/scikit-learn
tags:
  - cli
---

# scikit-learn

CLI tool: scikit-learn

## Usage

```bash
# Show help
scikit-learn --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run scikit-learn -- --help --json

# Introspect command schema
agents-cli schema scikit-learn --json

# Dry-run before executing
agents-cli run scikit-learn -- <args> --dry-run
```
