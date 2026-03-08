---
name: mlc-llm
version: 0.0.0
description: "Universal LLM Deployment Engine with ML Compilation. Use this skill when working with mlc-llm-related tasks."
ingredients:
  - mlc-ai/mlc-llm
tags:
  - language-model
  - llm
  - machine-learning-compilation
  - tvm
  - cli
# homepage: https://llm.mlc.ai/
# license: Apache-2.0
---

# mlc-llm

Universal LLM Deployment Engine with ML Compilation

**Source**: https://llm.mlc.ai/

## Usage

```bash
# Show help
mlc-llm --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run mlc-llm -- --help --json

# Introspect command schema
agents-cli schema mlc-llm --json

# Dry-run before executing
agents-cli run mlc-llm -- <args> --dry-run
```
