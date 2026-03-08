---
name: quarto-cli
version: 0.0.0
description: "CLI tool: quarto-cli. Use this skill when working with quarto-cli-related tasks."
ingredients:
  - quarto-dev/quarto-cli
tags:
  - cli
---

# quarto-cli

CLI tool: quarto-cli

## Usage

```bash
# Show help
quarto-cli --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run quarto-cli -- --help --json

# Introspect command schema
agents-cli schema quarto-cli --json

# Dry-run before executing
agents-cli run quarto-cli -- <args> --dry-run
```
