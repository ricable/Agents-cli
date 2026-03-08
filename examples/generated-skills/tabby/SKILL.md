---
name: tabby
version: 0.0.0
description: "Self-hosted AI coding assistant. Use this skill when working with tabby-related tasks."
ingredients:
  - TabbyML/tabby
tags:
  - ai
  - codegen
  - coding-assistant
  - coding-language
  - developer-experience
  - developer-tools
  - gen-ai
  - ide
  - llms
  - cli
# homepage: https://tabbyml.com
# license: NOASSERTION
---

# tabby

Self-hosted AI coding assistant

**Source**: https://tabbyml.com

## Usage

```bash
# Show help
tabby --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run tabby -- --help --json

# Introspect command schema
agents-cli schema tabby --json

# Dry-run before executing
agents-cli run tabby -- <args> --dry-run
```
