---
name: composio
version: 0.10.0-alpha.1
description: "Composio powers 1000+ toolkits, tool search, context management, authentication, and a sandboxed workbench to help you build AI agents that turn intent into action.. Use this skill when working with composio-related tasks."
ingredients:
  - ComposioHQ/composio
tags:
  - agentic-ai
  - agents
  - ai
  - ai-agents
  - aiagents
  - developer-tools
  - function-calling
  - gpt-4
  - javascript
  - js
  - llm
  - llmops
  - mcp
  - python
  - remote-mcp-server
  - sse
  - typescript
  - cli
# homepage: https://docs.composio.dev
# license: MIT
---

# composio

Composio powers 1000+ toolkits, tool search, context management, authentication, and a sandboxed workbench to help you build AI agents that turn intent into action.

**Source**: https://docs.composio.dev

## Usage

```bash
# Show help
composio --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run composio -- --help --json

# Introspect command schema
agents-cli schema composio --json

# Dry-run before executing
agents-cli run composio -- <args> --dry-run
```
