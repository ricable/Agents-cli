---
name: chatGPT-shell-cli
version: 0.0.0
description: "CLI tool: chatGPT-shell-cli. Use this skill when working with chatGPT-shell-cli-related tasks."
ingredients:
  - 0xacx/chatGPT-shell-cli
tags:
  - cli
---

# chatGPT-shell-cli

CLI tool: chatGPT-shell-cli

## Usage

```bash
# Show help
chatGPT-shell-cli --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run chatGPT-shell-cli -- --help --json

# Introspect command schema
agents-cli schema chatGPT-shell-cli --json

# Dry-run before executing
agents-cli run chatGPT-shell-cli -- <args> --dry-run
```
