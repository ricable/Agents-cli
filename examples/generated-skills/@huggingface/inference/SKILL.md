---
name: @huggingface/inference
version: 4.13.15
description: "Typescript client for the Hugging Face Inference Providers and Inference Endpoints. Use this skill when working with @huggingface/inference-related tasks."
ingredients:
  - @huggingface/inference
tags:
  - ai
  - hugging face
  - hugging face typescript
  - huggingface
  - huggingface-inference-api
  - huggingface-inference-api-typescript
  - inference
  - cli
# homepage: https://github.com/huggingface/huggingface.js#readme
# license: MIT
---

# @huggingface/inference

Typescript client for the Hugging Face Inference Providers and Inference Endpoints

**Source**: https://github.com/huggingface/huggingface.js#readme

## Usage

```bash
# Show help
@huggingface/inference --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run @huggingface/inference -- --help --json

# Introspect command schema
agents-cli schema @huggingface/inference --json

# Dry-run before executing
agents-cli run @huggingface/inference -- <args> --dry-run
```
