---
name: gpt-cli
version: 0.0.0
description: "Command-line interface for ChatGPT, Claude and Bard. Use this skill when working with gpt-cli-related tasks."
ingredients:
  - kharvd/gpt-cli
tags:
  - anthropic
  - anthropic-claude
  - assistant
  - bard
  - chatgpt
  - claude
  - cli
  - command-line
  - google-bard
  - gpt-3
  - gpt-4
  - gpt-cli
  - gpt-client
  - llm
  - openai
  - palm2
# homepage: https://github.com/kharvd/gpt-cli
# license: MIT
---

# gpt-cli

Command-line interface for ChatGPT, Claude and Bard

**Source**: https://github.com/kharvd/gpt-cli

## Usage

```bash
# Show help
gpt-cli --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run gpt-cli -- --help --json

# Introspect command schema
agents-cli schema gpt-cli --json

# Dry-run before executing
agents-cli run gpt-cli -- <args> --dry-run
```
