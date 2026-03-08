---
name: chatgpt-cli
version: 0.0.0
description: "ChatGPT CLI is a powerful, multi-provider command-line interface for working with modern LLMs. It supports OpenAI, Azure, Perplexity, LLaMA, and more, with features like streaming, interactive chat, prompt files, image/audio I/O, MCP tool calls, and an experimental agent mode for safe, multi-step automation.. Use this skill when working with chatgpt-cli-related tasks."
ingredients:
  - kardolus/chatgpt-cli
tags:
  - agent
  - agentic-ai
  - azure
  - chatgpt
  - cli
  - go
  - golang
  - gpt
  - language-model
  - llama
  - mcp-client
  - openai
  - perplexity
# homepage: https://github.com/kardolus/chatgpt-cli
# license: MIT
---

# chatgpt-cli

ChatGPT CLI is a powerful, multi-provider command-line interface for working with modern LLMs. It supports OpenAI, Azure, Perplexity, LLaMA, and more, with features like streaming, interactive chat, prompt files, image/audio I/O, MCP tool calls, and an experimental agent mode for safe, multi-step automation.

**Source**: https://github.com/kardolus/chatgpt-cli

## Usage

```bash
# Show help
chatgpt-cli --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run chatgpt-cli -- --help --json

# Introspect command schema
agents-cli schema chatgpt-cli --json

# Dry-run before executing
agents-cli run chatgpt-cli -- <args> --dry-run
```
