---
name: civitai
version: 5.0.1464
description: "CLI tool: civitai. Use this skill when working with civitai-related tasks."
ingredients:
  - civitai/civitai
tags:
  - cli
---

# civitai

CLI tool: civitai

## Usage

```bash
# Show help
civitai --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run civitai -- --help --json

# Introspect command schema
agents-cli schema civitai --json

# Dry-run before executing
agents-cli run civitai -- <args> --dry-run
```
