---
name: text-generation-inference
version: 0.0.0
description: "Large Language Model Text Generation Inference. Use this skill when working with text-generation-inference-related tasks."
ingredients:
  - huggingface/text-generation-inference
tags:
  - bloom
  - deep-learning
  - falcon
  - gpt
  - inference
  - nlp
  - pytorch
  - starcoder
  - transformer
  - cli
# homepage: http://hf.co/docs/text-generation-inference
# license: Apache-2.0
---

# text-generation-inference

Large Language Model Text Generation Inference

**Source**: http://hf.co/docs/text-generation-inference

## Usage

```bash
# Show help
text-generation-inference --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run text-generation-inference -- --help --json

# Introspect command schema
agents-cli schema text-generation-inference --json

# Dry-run before executing
agents-cli run text-generation-inference -- <args> --dry-run
```
