---
name: sgpt
version: 0.0.0
description: "SGPT is a command-line tool that provides a convenient way to interact with OpenAI models, enabling users to run queries, generate shell commands and produce code directly from the terminal.. Use this skill when working with sgpt-related tasks."
ingredients:
  - tbckr/sgpt
tags:
  - anthropic
  - anthropic-claude
  - bash
  - cli
  - gemini
  - gemini-api
  - gemini-pro
  - go
  - gpt-3
  - gpt-4
  - gpt-4-vision
  - gpt-4-vision-preview
  - gpt-4o
  - o1-mini
  - o1-preview
  - openai
  - openrouter
  - openrouter-api
  - shell
# homepage: https://github.com/tbckr/sgpt
# license: MIT
---

# sgpt

SGPT is a command-line tool that provides a convenient way to interact with OpenAI models, enabling users to run queries, generate shell commands and produce code directly from the terminal.

**Source**: https://github.com/tbckr/sgpt

## Usage

```bash
# Show help
sgpt --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run sgpt -- --help --json

# Introspect command schema
agents-cli schema sgpt --json

# Dry-run before executing
agents-cli run sgpt -- <args> --dry-run
```
