---
name: PaddleOCR
version: 0.0.0
description: "CLI tool: PaddleOCR. Use this skill when working with PaddleOCR-related tasks."
ingredients:
  - PaddlePaddle/PaddleOCR
tags:
  - cli
---

# PaddleOCR

CLI tool: PaddleOCR

## Usage

```bash
# Show help
PaddleOCR --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run PaddleOCR -- --help --json

# Introspect command schema
agents-cli schema PaddleOCR --json

# Dry-run before executing
agents-cli run PaddleOCR -- <args> --dry-run
```
