---
name: plandex
version: 0.0.0
description: "Open source AI coding agent. Designed for large projects and real world tasks.. Use this skill when working with plandex-related tasks."
ingredients:
  - plandex-ai/plandex
tags:
  - ai
  - ai-agents
  - ai-developer-tools
  - ai-tools
  - cli
  - command-line
  - developer-tools
  - git
  - golang
  - gpt-4
  - llm
  - openai
  - polyglot-programming
  - terminal
  - terminal-based
  - terminal-ui
# homepage: https://plandex.ai
# license: MIT
---

# plandex

Open source AI coding agent. Designed for large projects and real world tasks.

**Source**: https://plandex.ai

## Usage

```bash
# Show help
plandex --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run plandex -- --help --json

# Introspect command schema
agents-cli schema plandex --json

# Dry-run before executing
agents-cli run plandex -- <args> --dry-run
```
