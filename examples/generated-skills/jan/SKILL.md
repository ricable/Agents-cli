---
name: jan
version: 0.0.0
description: "Jan is an open source alternative to ChatGPT that runs 100% offline on your computer.. Use this skill when working with jan-related tasks."
ingredients:
  - janhq/jan
tags:
  - chatgpt
  - gpt
  - llamacpp
  - llm
  - localai
  - open-source
  - self-hosted
  - tauri
  - cli
# homepage: https://jan.ai/
# license: NOASSERTION
---

# jan

Jan is an open source alternative to ChatGPT that runs 100% offline on your computer.

**Source**: https://jan.ai/

## Usage

```bash
# Show help
jan --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run jan -- --help --json

# Introspect command schema
agents-cli schema jan --json

# Dry-run before executing
agents-cli run jan -- <args> --dry-run
```
