---
name: llm-awq
version: 0.0.0
description: "[MLSys 2024 Best Paper Award] AWQ: Activation-aware Weight Quantization for LLM Compression and Acceleration. Use this skill when working with llm-awq-related tasks."
ingredients:
  - mit-han-lab/llm-awq
tags:
  - cli
# homepage: https://github.com/mit-han-lab/llm-awq
# license: MIT
---

# llm-awq

[MLSys 2024 Best Paper Award] AWQ: Activation-aware Weight Quantization for LLM Compression and Acceleration

**Source**: https://github.com/mit-han-lab/llm-awq

## Usage

```bash
# Show help
llm-awq --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run llm-awq -- --help --json

# Introspect command schema
agents-cli schema llm-awq --json

# Dry-run before executing
agents-cli run llm-awq -- <args> --dry-run
```
