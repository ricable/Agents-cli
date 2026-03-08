---
name: mem0
version: 0.0.0
description: "Universal memory layer for AI Agents. Use this skill when working with mem0-related tasks."
ingredients:
  - mem0ai/mem0
tags:
  - agents
  - ai
  - ai-agents
  - application
  - chatbots
  - chatgpt
  - genai
  - llm
  - long-term-memory
  - memory
  - memory-management
  - python
  - rag
  - state-management
  - cli
# homepage: https://mem0.ai
# license: Apache-2.0
---

# mem0

Universal memory layer for AI Agents

**Source**: https://mem0.ai

## Usage

```bash
# Show help
mem0 --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run mem0 -- --help --json

# Introspect command schema
agents-cli schema mem0 --json

# Dry-run before executing
agents-cli run mem0 -- <args> --dry-run
```
