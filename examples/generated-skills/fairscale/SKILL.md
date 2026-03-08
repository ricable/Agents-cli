---
name: fairscale
version: 0.0.0
description: "CLI tool: fairscale. Use this skill when working with fairscale-related tasks."
ingredients:
  - facebookresearch/fairscale
tags:
  - cli
---

# fairscale

CLI tool: fairscale

## Usage

```bash
# Show help
fairscale --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run fairscale -- --help --json

# Introspect command schema
agents-cli schema fairscale --json

# Dry-run before executing
agents-cli run fairscale -- <args> --dry-run
```
