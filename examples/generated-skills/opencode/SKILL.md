---
name: opencode
version: 0.0.0
description: "A powerful AI coding agent. Built for the terminal.. Use this skill when working with opencode-related tasks."
ingredients:
  - opencode-ai/opencode
tags:
  - ai
  - claude
  - code
  - llm
  - openai
  - cli
# homepage: https://github.com/opencode-ai/opencode
# license: MIT
---

# opencode

A powerful AI coding agent. Built for the terminal.

**Source**: https://github.com/opencode-ai/opencode

## Usage

```bash
# Show help
opencode --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run opencode -- --help --json

# Introspect command schema
agents-cli schema opencode --json

# Dry-run before executing
agents-cli run opencode -- <args> --dry-run
```
