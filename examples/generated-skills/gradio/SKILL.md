---
name: gradio
version: 0.0.1
description: "CLI tool: gradio. Use this skill when working with gradio-related tasks."
ingredients:
  - gradio-app/gradio
tags:
  - cli
---

# gradio

CLI tool: gradio

## Usage

```bash
# Show help
gradio --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run gradio -- --help --json

# Introspect command schema
agents-cli schema gradio --json

# Dry-run before executing
agents-cli run gradio -- <args> --dry-run
```
