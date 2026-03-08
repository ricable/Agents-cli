---
name: langsmith-sdk
version: 0.0.0
description: "CLI tool: langsmith-sdk. Use this skill when working with langsmith-sdk-related tasks."
ingredients:
  - langchain-ai/langsmith-sdk
tags:
  - cli
---

# langsmith-sdk

CLI tool: langsmith-sdk

## Usage

```bash
# Show help
langsmith-sdk --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run langsmith-sdk -- --help --json

# Introspect command schema
agents-cli schema langsmith-sdk --json

# Dry-run before executing
agents-cli run langsmith-sdk -- <args> --dry-run
```
