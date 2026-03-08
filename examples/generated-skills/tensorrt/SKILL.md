---
name: TensorRT
version: 0.0.0
description: "CLI tool: TensorRT. Use this skill when working with TensorRT-related tasks."
ingredients:
  - NVIDIA/TensorRT
tags:
  - cli
---

# TensorRT

CLI tool: TensorRT

## Usage

```bash
# Show help
TensorRT --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run TensorRT -- --help --json

# Introspect command schema
agents-cli schema TensorRT --json

# Dry-run before executing
agents-cli run TensorRT -- <args> --dry-run
```
