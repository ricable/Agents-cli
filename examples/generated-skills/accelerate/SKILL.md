---
name: accelerate
version: 0.0.0
description: "🚀 A simple way to launch, train, and use PyTorch models on almost any device and distributed configuration, automatic mixed precision (including fp8), and easy-to-configure FSDP and DeepSpeed support. Use this skill when working with accelerate-related tasks."
ingredients:
  - huggingface/accelerate
tags:
  - cli
# homepage: https://huggingface.co/docs/accelerate
# license: Apache-2.0
---

# accelerate

🚀 A simple way to launch, train, and use PyTorch models on almost any device and distributed configuration, automatic mixed precision (including fp8), and easy-to-configure FSDP and DeepSpeed support

**Source**: https://huggingface.co/docs/accelerate

## Usage

```bash
# Show help
accelerate --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run accelerate -- --help --json

# Introspect command schema
agents-cli schema accelerate --json

# Dry-run before executing
agents-cli run accelerate -- <args> --dry-run
```
