---
name: peft
version: 0.0.0
description: "🤗 PEFT: State-of-the-art Parameter-Efficient Fine-Tuning.. Use this skill when working with peft-related tasks."
ingredients:
  - huggingface/peft
tags:
  - adapter
  - diffusion
  - fine-tuning
  - llm
  - lora
  - parameter-efficient-learning
  - peft
  - python
  - pytorch
  - transformers
  - cli
# homepage: https://huggingface.co/docs/peft
# license: Apache-2.0
---

# peft

🤗 PEFT: State-of-the-art Parameter-Efficient Fine-Tuning.

**Source**: https://huggingface.co/docs/peft

## Usage

```bash
# Show help
peft --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run peft -- --help --json

# Introspect command schema
agents-cli schema peft --json

# Dry-run before executing
agents-cli run peft -- <args> --dry-run
```
