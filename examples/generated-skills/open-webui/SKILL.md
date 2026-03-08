---
name: open-webui
version: 0.8.9
description: "User-friendly AI Interface (Supports Ollama, OpenAI API, ...). Use this skill when working with open-webui-related tasks."
ingredients:
  - open-webui/open-webui
tags:
  - ai
  - llm
  - llm-ui
  - llm-webui
  - llms
  - mcp
  - ollama
  - ollama-webui
  - open-webui
  - openai
  - openapi
  - rag
  - self-hosted
  - ui
  - webui
  - cli
# homepage: https://openwebui.com
# license: NOASSERTION
---

# open-webui

User-friendly AI Interface (Supports Ollama, OpenAI API, ...)

**Source**: https://openwebui.com

## Usage

```bash
# Show help
open-webui --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run open-webui -- --help --json

# Introspect command schema
agents-cli schema open-webui --json

# Dry-run before executing
agents-cli run open-webui -- <args> --dry-run
```
