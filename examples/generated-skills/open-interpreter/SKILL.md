---
name: open-interpreter
version: 0.0.0
description: "A natural language interface for computers. Use this skill when working with open-interpreter-related tasks."
ingredients:
  - OpenInterpreter/open-interpreter
tags:
  - chatgpt
  - gpt-4
  - interpreter
  - javascript
  - nodejs
  - python
  - cli
# homepage: http://openinterpreter.com/
# license: AGPL-3.0
---

# open-interpreter

A natural language interface for computers

**Source**: http://openinterpreter.com/

## Usage

```bash
# Show help
open-interpreter --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run open-interpreter -- --help --json

# Introspect command schema
agents-cli schema open-interpreter --json

# Dry-run before executing
agents-cli run open-interpreter -- <args> --dry-run
```
