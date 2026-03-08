---
name: ragapp
version: 0.1.5
description: "CLI tool: ragapp. Use this skill when working with ragapp-related tasks."
ingredients:
  - ragapp/ragapp
tags:
  - cli
---

# ragapp

CLI tool: ragapp

## Usage

```bash
# Show help
ragapp --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run ragapp -- --help --json

# Introspect command schema
agents-cli schema ragapp --json

# Dry-run before executing
agents-cli run ragapp -- <args> --dry-run
```
