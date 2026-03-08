---
name: kornia
version: 0.0.0
description: "CLI tool: kornia. Use this skill when working with kornia-related tasks."
ingredients:
  - kornia/kornia
tags:
  - cli
---

# kornia

CLI tool: kornia

## Usage

```bash
# Show help
kornia --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run kornia -- --help --json

# Introspect command schema
agents-cli schema kornia --json

# Dry-run before executing
agents-cli run kornia -- <args> --dry-run
```
