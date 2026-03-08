---
name: @e2b/code-interpreter
version: 2.3.3
description: "E2B Code Interpreter - Stateful code execution. Use this skill when working with @e2b/code-interpreter-related tasks."
ingredients:
  - @e2b/code-interpreter
tags:
  - e2b
  - ai-agents
  - agents
  - ai
  - code-interpreter
  - stateful-sandbox
  - stateful-serverrless
  - sandbox
  - code
  - runtime
  - vm
  - cli
# homepage: https://e2b.dev
# license: MIT
---

# @e2b/code-interpreter

E2B Code Interpreter - Stateful code execution

**Source**: https://e2b.dev

## Usage

```bash
# Show help
@e2b/code-interpreter --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run @e2b/code-interpreter -- --help --json

# Introspect command schema
agents-cli schema @e2b/code-interpreter --json

# Dry-run before executing
agents-cli run @e2b/code-interpreter -- <args> --dry-run
```
