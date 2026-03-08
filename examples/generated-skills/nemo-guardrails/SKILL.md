---
name: NeMo-Guardrails
version: 0.0.0
description: "CLI tool: NeMo-Guardrails. Use this skill when working with NeMo-Guardrails-related tasks."
ingredients:
  - NVIDIA/NeMo-Guardrails
tags:
  - cli
---

# NeMo-Guardrails

CLI tool: NeMo-Guardrails

## Usage

```bash
# Show help
NeMo-Guardrails --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run NeMo-Guardrails -- --help --json

# Introspect command schema
agents-cli schema NeMo-Guardrails --json

# Dry-run before executing
agents-cli run NeMo-Guardrails -- <args> --dry-run
```
