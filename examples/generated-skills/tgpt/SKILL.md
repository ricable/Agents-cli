---
name: tgpt
version: 0.0.0
description: "AI Chatbots in terminal for free. Use this skill when working with tgpt-related tasks."
ingredients:
  - aandrew-me/tgpt
tags:
  - ai
  - chatbot
  - chatgpt
  - cli
  - go
  - golang
  - gpt4
  - linux
  - llama
  - macos
  - mixtral
  - terminal
  - windows
# homepage: https://github.com/aandrew-me/tgpt
# license: GPL-3.0
---

# tgpt

AI Chatbots in terminal for free

**Source**: https://github.com/aandrew-me/tgpt

## Usage

```bash
# Show help
tgpt --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run tgpt -- --help --json

# Introspect command schema
agents-cli schema tgpt --json

# Dry-run before executing
agents-cli run tgpt -- <args> --dry-run
```
