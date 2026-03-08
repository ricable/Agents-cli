---
name: bitsandbytes
version: 0.0.0
description: "Accessible large language models via k-bit quantization for PyTorch.. Use this skill when working with bitsandbytes-related tasks."
ingredients:
  - bitsandbytes-foundation/bitsandbytes
tags:
  - llm
  - machine-learning
  - pytorch
  - qlora
  - quantization
  - cli
# homepage: https://huggingface.co/docs/bitsandbytes/main/en/index
# license: MIT
---

# bitsandbytes

Accessible large language models via k-bit quantization for PyTorch.

**Source**: https://huggingface.co/docs/bitsandbytes/main/en/index

## Usage

```bash
# Show help
bitsandbytes --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run bitsandbytes -- --help --json

# Introspect command schema
agents-cli schema bitsandbytes --json

# Dry-run before executing
agents-cli run bitsandbytes -- <args> --dry-run
```
