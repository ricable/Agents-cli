---
name: babyagi
version: 0.0.0
description: "CLI tool: babyagi. Use this skill when working with babyagi-related tasks."
ingredients:
  - yoheinakajima/babyagi
tags:
  - cli
---

# babyagi

CLI tool: babyagi

## Usage

```bash
# Show help
babyagi --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run babyagi -- --help --json

# Introspect command schema
agents-cli schema babyagi --json

# Dry-run before executing
agents-cli run babyagi -- <args> --dry-run
```
