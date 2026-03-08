---
name: gpt4all
version: 0.0.0
description: "GPT4All: Run Local LLMs on Any Device. Open-source and available for commercial use.. Use this skill when working with gpt4all-related tasks."
ingredients:
  - nomic-ai/gpt4all
tags:
  - ai-chat
  - llm-inference
  - cli
# homepage: https://nomic.ai/gpt4all
# license: MIT
---

# gpt4all

GPT4All: Run Local LLMs on Any Device. Open-source and available for commercial use.

**Source**: https://nomic.ai/gpt4all

## Usage

```bash
# Show help
gpt4all --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run gpt4all -- --help --json

# Introspect command schema
agents-cli schema gpt4all --json

# Dry-run before executing
agents-cli run gpt4all -- <args> --dry-run
```
