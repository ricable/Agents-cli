---
name: panel
version: 0.0.0
description: "CLI tool: panel. Use this skill when working with panel-related tasks."
ingredients:
  - holoviz/panel
tags:
  - cli
---

# panel

CLI tool: panel

## Usage

```bash
# Show help
panel --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run panel -- --help --json

# Introspect command schema
agents-cli schema panel --json

# Dry-run before executing
agents-cli run panel -- <args> --dry-run
```
