---
name: RAGatouille
version: 0.0.0
description: "CLI tool: RAGatouille. Use this skill when working with RAGatouille-related tasks."
ingredients:
  - AnswerDotAI/RAGatouille
tags:
  - cli
---

# RAGatouille

CLI tool: RAGatouille

## Usage

```bash
# Show help
RAGatouille --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run RAGatouille -- --help --json

# Introspect command schema
agents-cli schema RAGatouille --json

# Dry-run before executing
agents-cli run RAGatouille -- <args> --dry-run
```
