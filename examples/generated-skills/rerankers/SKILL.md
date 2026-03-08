---
name: rerankers
version: 0.0.0
description: "CLI tool: rerankers. Use this skill when working with rerankers-related tasks."
ingredients:
  - AnswerDotAI/rerankers
tags:
  - cli
---

# rerankers

CLI tool: rerankers

## Usage

```bash
# Show help
rerankers --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run rerankers -- --help --json

# Introspect command schema
agents-cli schema rerankers --json

# Dry-run before executing
agents-cli run rerankers -- <args> --dry-run
```
