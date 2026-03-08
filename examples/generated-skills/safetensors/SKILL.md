---
name: safetensors
version: 0.0.0
description: "Simple, safe way to store and distribute tensors. Use this skill when working with safetensors-related tasks."
ingredients:
  - huggingface/safetensors
tags:
  - cli
# homepage: https://huggingface.co/docs/safetensors
# license: Apache-2.0
---

# safetensors

Simple, safe way to store and distribute tensors

**Source**: https://huggingface.co/docs/safetensors

## Usage

```bash
# Show help
safetensors --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run safetensors -- --help --json

# Introspect command schema
agents-cli schema safetensors --json

# Dry-run before executing
agents-cli run safetensors -- <args> --dry-run
```
