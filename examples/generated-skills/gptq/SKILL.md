---
name: AutoGPTQ
version: 0.0.0
description: "An easy-to-use LLMs quantization package with user-friendly apis, based on GPTQ algorithm.. Use this skill when working with AutoGPTQ-related tasks."
ingredients:
  - AutoGPTQ/AutoGPTQ
tags:
  - deep-learning
  - inference
  - large-language-models
  - llms
  - nlp
  - pytorch
  - quantization
  - transformer
  - transformers
  - cli
# homepage: https://github.com/AutoGPTQ/AutoGPTQ
# license: MIT
---

# AutoGPTQ

An easy-to-use LLMs quantization package with user-friendly apis, based on GPTQ algorithm.

**Source**: https://github.com/AutoGPTQ/AutoGPTQ

## Usage

```bash
# Show help
AutoGPTQ --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run AutoGPTQ -- --help --json

# Introspect command schema
agents-cli schema AutoGPTQ --json

# Dry-run before executing
agents-cli run AutoGPTQ -- <args> --dry-run
```
