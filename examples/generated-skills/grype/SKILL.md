---
name: grype
version: 0.0.0
description: "CLI tool: grype. Use this skill when working with grype-related tasks."
ingredients:
  - anchore/grype
tags:
  - cli
---

# grype

CLI tool: grype

## Usage

```bash
# Show help
grype --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run grype -- --help --json

# Introspect command schema
agents-cli schema grype --json

# Dry-run before executing
agents-cli run grype -- <args> --dry-run
```
