---
name: pandera
version: 0.0.0
description: "CLI tool: pandera. Use this skill when working with pandera-related tasks."
ingredients:
  - unionai-oss/pandera
tags:
  - cli
---

# pandera

CLI tool: pandera

## Usage

```bash
# Show help
pandera --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run pandera -- --help --json

# Introspect command schema
agents-cli schema pandera --json

# Dry-run before executing
agents-cli run pandera -- <args> --dry-run
```
