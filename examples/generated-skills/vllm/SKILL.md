---
name: vllm
version: 0.0.0
description: "A high-throughput and memory-efficient inference and serving engine for LLMs. Use this skill when working with vllm-related tasks."
ingredients:
  - vllm-project/vllm
tags:
  - amd
  - blackwell
  - cuda
  - deepseek
  - deepseek-v3
  - gpt
  - gpt-oss
  - inference
  - kimi
  - llama
  - llm
  - llm-serving
  - model-serving
  - moe
  - openai
  - pytorch
  - qwen
  - qwen3
  - tpu
  - transformer
  - cli
# homepage: https://vllm.ai
# license: Apache-2.0
---

# vllm

A high-throughput and memory-efficient inference and serving engine for LLMs

**Source**: https://vllm.ai

## Usage

```bash
# Show help
vllm --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run vllm -- --help --json

# Introspect command schema
agents-cli schema vllm --json

# Dry-run before executing
agents-cli run vllm -- <args> --dry-run
```
