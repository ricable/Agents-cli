---
name: anything-llm
version: 1.11.1
description: "The all-in-one AI productivity accelerator. On device and privacy first with no annoying setup or configration.. Use this skill when working with anything-llm-related tasks."
ingredients:
  - Mintplex-Labs/anything-llm
tags:
  - ai-agents
  - custom-ai-agents
  - deepseek
  - kimi
  - llama3
  - llm
  - lmstudio
  - local-llm
  - localai
  - mcp
  - mcp-servers
  - moonshot
  - multimodal
  - no-code
  - ollama
  - qwen3
  - rag
  - vector-database
  - web-scraping
  - cli
# homepage: https://anythingllm.com
# license: MIT
---

# anything-llm

The all-in-one AI productivity accelerator. On device and privacy first with no annoying setup or configration.

**Source**: https://anythingllm.com

## Usage

```bash
# Show help
anything-llm --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run anything-llm -- --help --json

# Introspect command schema
agents-cli schema anything-llm --json

# Dry-run before executing
agents-cli run anything-llm -- <args> --dry-run
```
