---
name: aichat
version: 0.0.0
description: "All-in-one LLM CLI tool featuring Shell Assistant, Chat-REPL, RAG, AI Tools & Agents, with access to OpenAI, Claude, Gemini, Ollama, Groq, and more.. Use this skill when working with aichat-related tasks."
ingredients:
  - sigoden/aichat
tags:
  - ai
  - ai-agents
  - chatbot
  - claude
  - cli
  - function-calling
  - gemini
  - llm
  - ollama
  - openai
  - rag
  - rust
  - shell
  - webui
# homepage: https://github.com/sigoden/aichat
# license: Apache-2.0
---

# aichat

All-in-one LLM CLI tool featuring Shell Assistant, Chat-REPL, RAG, AI Tools & Agents, with access to OpenAI, Claude, Gemini, Ollama, Groq, and more.

**Source**: https://github.com/sigoden/aichat

## Usage

```bash
# Show help
aichat --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run aichat -- --help --json

# Introspect command schema
agents-cli schema aichat --json

# Dry-run before executing
agents-cli run aichat -- <args> --dry-run
```
