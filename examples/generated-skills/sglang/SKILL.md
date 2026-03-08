---
name: sglang
version: 0.0.0
description: "SGLang is a high-performance serving framework for large language models and multimodal models.. Use this skill when working with sglang-related tasks."
ingredients:
  - sgl-project/sglang
tags:
  - attention
  - blackwell
  - cuda
  - deepseek
  - diffusion
  - glm
  - gpt-oss
  - inference
  - llama
  - llm
  - minimax
  - moe
  - qwen
  - qwen-image
  - reinforcement-learning
  - transformer
  - vlm
  - wan
  - cli
# homepage: https://sglang.io
# license: Apache-2.0
---

# sglang

SGLang is a high-performance serving framework for large language models and multimodal models.

**Source**: https://sglang.io

## Usage

```bash
# Show help
sglang --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run sglang -- --help --json

# Introspect command schema
agents-cli schema sglang --json

# Dry-run before executing
agents-cli run sglang -- <args> --dry-run
```
