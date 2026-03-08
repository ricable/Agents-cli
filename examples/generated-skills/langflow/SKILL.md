---
name: langflow
version: 0.0.0
description: "Langflow is a powerful tool for building and deploying AI-powered agents and workflows.. Use this skill when working with langflow-related tasks."
ingredients:
  - langflow-ai/langflow
tags:
  - agents
  - chatgpt
  - generative-ai
  - large-language-models
  - multiagent
  - react-flow
  - cli
# homepage: http://www.langflow.org
# license: MIT
---

# langflow

Langflow is a powerful tool for building and deploying AI-powered agents and workflows.

**Source**: http://www.langflow.org

## Usage

```bash
# Show help
langflow --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run langflow -- --help --json

# Introspect command schema
agents-cli schema langflow --json

# Dry-run before executing
agents-cli run langflow -- <args> --dry-run
```
