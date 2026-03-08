---
name: gpt-engineer
version: 0.0.0
description: "CLI platform to experiment with codegen. Precursor to: https://lovable.dev. Use this skill when working with gpt-engineer-related tasks."
ingredients:
  - gpt-engineer-org/gpt-engineer
tags:
  - ai
  - autonomous-agent
  - code-generation
  - codebase-generation
  - codegen
  - coding-assistant
  - gpt-4
  - gpt-engineer
  - openai
  - python
  - cli
# homepage: https://github.com/AntonOsika/gpt-engineer
# license: MIT
---

# gpt-engineer

CLI platform to experiment with codegen. Precursor to: https://lovable.dev

**Source**: https://github.com/AntonOsika/gpt-engineer

## Usage

```bash
# Show help
gpt-engineer --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run gpt-engineer -- --help --json

# Introspect command schema
agents-cli schema gpt-engineer --json

# Dry-run before executing
agents-cli run gpt-engineer -- <args> --dry-run
```
