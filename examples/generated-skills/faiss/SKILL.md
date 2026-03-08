---
name: faiss
version: 0.0.0
description: "CLI tool: faiss. Use this skill when working with faiss-related tasks."
ingredients:
  - facebookresearch/faiss
tags:
  - cli
---

# faiss

CLI tool: faiss

## Usage

```bash
# Show help
faiss --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run faiss -- --help --json

# Introspect command schema
agents-cli schema faiss --json

# Dry-run before executing
agents-cli run faiss -- <args> --dry-run
```
