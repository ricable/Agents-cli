---
name: Megatron-LM
version: 0.0.0
description: "CLI tool: Megatron-LM. Use this skill when working with Megatron-LM-related tasks."
ingredients:
  - NVIDIA/Megatron-LM
tags:
  - cli
---

# Megatron-LM

CLI tool: Megatron-LM

## Usage

```bash
# Show help
Megatron-LM --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run Megatron-LM -- --help --json

# Introspect command schema
agents-cli schema Megatron-LM --json

# Dry-run before executing
agents-cli run Megatron-LM -- <args> --dry-run
```
