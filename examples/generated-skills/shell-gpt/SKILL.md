---
name: shell_gpt
version: 0.0.0
description: "A command-line productivity tool powered by AI large language models like GPT-5, will help you accomplish your tasks faster and more efficiently.. Use this skill when working with shell_gpt-related tasks."
ingredients:
  - TheR1D/shell_gpt
tags:
  - chatgpt
  - cheat-sheet
  - cli
  - commands
  - gpt-3
  - gpt-4
  - gpt-5
  - linux
  - llama
  - llm
  - ollama
  - openai
  - productivity
  - python
  - shell
  - terminal
# homepage: https://github.com/TheR1D/shell_gpt
# license: MIT
---

# shell_gpt

A command-line productivity tool powered by AI large language models like GPT-5, will help you accomplish your tasks faster and more efficiently.

**Source**: https://github.com/TheR1D/shell_gpt

## Usage

```bash
# Show help
shell_gpt --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run shell_gpt -- --help --json

# Introspect command schema
agents-cli schema shell_gpt --json

# Dry-run before executing
agents-cli run shell_gpt -- <args> --dry-run
```
