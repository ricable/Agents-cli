---
name: dify
version: 0.0.0
description: "Production-ready platform for agentic workflow development.. Use this skill when working with dify-related tasks."
ingredients:
  - langgenius/dify
tags:
  - agent
  - agentic-ai
  - agentic-framework
  - agentic-workflow
  - ai
  - automation
  - gemini
  - genai
  - gpt
  - gpt-4
  - llm
  - low-code
  - mcp
  - nextjs
  - no-code
  - openai
  - orchestration
  - python
  - rag
  - workflow
  - cli
# homepage: https://dify.ai
# license: NOASSERTION
---

# dify

Production-ready platform for agentic workflow development.

**Source**: https://dify.ai

## Usage

```bash
# Show help
dify --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run dify -- --help --json

# Introspect command schema
agents-cli schema dify --json

# Dry-run before executing
agents-cli run dify -- <args> --dry-run
```
