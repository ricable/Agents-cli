---
name: helm
version: 0.0.0
description: "CLI tool: helm. Use this skill when working with helm-related tasks."
ingredients:
  - helm/helm
tags:
  - cli
---

# helm

CLI tool: helm

## Usage

```bash
# Show help
helm --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run helm -- --help --json

# Introspect command schema
agents-cli schema helm --json

# Dry-run before executing
agents-cli run helm -- <args> --dry-run
```
