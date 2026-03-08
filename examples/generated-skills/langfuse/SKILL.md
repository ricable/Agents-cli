---
name: langfuse
version: 3.156.0
description: "CLI tool: langfuse. Use this skill when working with langfuse-related tasks."
ingredients:
  - langfuse/langfuse
tags:
  - cli
---

# langfuse

CLI tool: langfuse

## Usage

```bash
# Show help
langfuse --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run langfuse -- --help --json

# Introspect command schema
agents-cli schema langfuse --json

# Dry-run before executing
agents-cli run langfuse -- <args> --dry-run
```
