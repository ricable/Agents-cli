---
name: pytorch-image-models
version: 0.0.0
description: "CLI tool: pytorch-image-models. Use this skill when working with pytorch-image-models-related tasks."
ingredients:
  - huggingface/pytorch-image-models
tags:
  - cli
---

# pytorch-image-models

CLI tool: pytorch-image-models

## Usage

```bash
# Show help
pytorch-image-models --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run pytorch-image-models -- --help --json

# Introspect command schema
agents-cli schema pytorch-image-models --json

# Dry-run before executing
agents-cli run pytorch-image-models -- <args> --dry-run
```
