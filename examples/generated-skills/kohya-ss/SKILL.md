---
name: sd-scripts
version: 0.0.0
description: "CLI tool: sd-scripts. Use this skill when working with sd-scripts-related tasks."
ingredients:
  - kohya-ss/sd-scripts
tags:
  - cli
---

# sd-scripts

CLI tool: sd-scripts

## Usage

```bash
# Show help
sd-scripts --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run sd-scripts -- --help --json

# Introspect command schema
agents-cli schema sd-scripts --json

# Dry-run before executing
agents-cli run sd-scripts -- <args> --dry-run
```
