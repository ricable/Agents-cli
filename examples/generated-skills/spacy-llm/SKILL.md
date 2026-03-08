---
name: spacy-llm
version: 0.0.0
description: "CLI tool: spacy-llm. Use this skill when working with spacy-llm-related tasks."
ingredients:
  - explosion/spacy-llm
tags:
  - cli
---

# spacy-llm

CLI tool: spacy-llm

## Usage

```bash
# Show help
spacy-llm --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run spacy-llm -- --help --json

# Introspect command schema
agents-cli schema spacy-llm --json

# Dry-run before executing
agents-cli run spacy-llm -- <args> --dry-run
```
