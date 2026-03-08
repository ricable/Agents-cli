---
name: lmdeploy
version: 0.0.0
description: "LMDeploy is a toolkit for compressing, deploying, and serving LLMs.. Use this skill when working with lmdeploy-related tasks."
ingredients:
  - InternLM/lmdeploy
tags:
  - codellama
  - cuda-kernels
  - deepspeed
  - fastertransformer
  - internlm
  - llama
  - llama2
  - llama3
  - llm
  - llm-inference
  - turbomind
  - cli
# homepage: https://lmdeploy.readthedocs.io/en/latest
# license: Apache-2.0
---

# lmdeploy

LMDeploy is a toolkit for compressing, deploying, and serving LLMs.

**Source**: https://lmdeploy.readthedocs.io/en/latest

## Usage

```bash
# Show help
lmdeploy --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run lmdeploy -- --help --json

# Introspect command schema
agents-cli schema lmdeploy --json

# Dry-run before executing
agents-cli run lmdeploy -- <args> --dry-run
```
