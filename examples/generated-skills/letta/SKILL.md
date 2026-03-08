---
name: letta
version: 0.0.0
description: "Letta is the platform for building stateful agents: AI with advanced memory that can learn and self-improve over time.. Use this skill when working with letta-related tasks."
ingredients:
  - letta-ai/letta
tags:
  - ai
  - ai-agents
  - llm
  - llm-agent
  - cli
# homepage: https://docs.letta.com/
# license: Apache-2.0
---

# letta

Letta is the platform for building stateful agents: AI with advanced memory that can learn and self-improve over time.

**Source**: https://docs.letta.com/

## Usage

```bash
# Show help
letta --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run letta -- --help --json

# Introspect command schema
agents-cli schema letta --json

# Dry-run before executing
agents-cli run letta -- <args> --dry-run
```
