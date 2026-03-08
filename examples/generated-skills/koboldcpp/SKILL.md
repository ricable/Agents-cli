---
name: koboldcpp
version: 0.0.0
description: "Run GGUF models easily with a KoboldAI UI. One File. Zero Install.. Use this skill when working with koboldcpp-related tasks."
ingredients:
  - LostRuins/koboldcpp
tags:
  - gemma
  - ggml
  - gguf
  - koboldai
  - koboldcpp
  - language-model
  - llama
  - llamacpp
  - llm
  - mistral
  - cli
# homepage: https://github.com/LostRuins/koboldcpp/releases/latest
# license: AGPL-3.0
---

# koboldcpp

Run GGUF models easily with a KoboldAI UI. One File. Zero Install.

**Source**: https://github.com/LostRuins/koboldcpp/releases/latest

## Usage

```bash
# Show help
koboldcpp --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run koboldcpp -- --help --json

# Introspect command schema
agents-cli schema koboldcpp --json

# Dry-run before executing
agents-cli run koboldcpp -- <args> --dry-run
```
