---
name: private-gpt
version: 0.0.0
description: "Interact with your documents using the power of GPT, 100% privately, no data leaks. Use this skill when working with private-gpt-related tasks."
ingredients:
  - zylon-ai/private-gpt
tags:
  - cli
# homepage: https://privategpt.dev
# license: Apache-2.0
---

# private-gpt

Interact with your documents using the power of GPT, 100% privately, no data leaks

**Source**: https://privategpt.dev

## Usage

```bash
# Show help
private-gpt --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run private-gpt -- --help --json

# Introspect command schema
agents-cli schema private-gpt --json

# Dry-run before executing
agents-cli run private-gpt -- <args> --dry-run
```
