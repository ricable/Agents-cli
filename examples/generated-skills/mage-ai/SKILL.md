---
name: mage-ai
version: 0.0.0
description: "CLI tool: mage-ai. Use this skill when working with mage-ai-related tasks."
ingredients:
  - mage-ai/mage-ai
tags:
  - cli
---

# mage-ai

CLI tool: mage-ai

## Usage

```bash
# Show help
mage-ai --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run mage-ai -- --help --json

# Introspect command schema
agents-cli schema mage-ai --json

# Dry-run before executing
agents-cli run mage-ai -- <args> --dry-run
```
