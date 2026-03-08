---
name: onnxruntime
version: 0.0.0
description: "CLI tool: onnxruntime. Use this skill when working with onnxruntime-related tasks."
ingredients:
  - microsoft/onnxruntime
tags:
  - cli
---

# onnxruntime

CLI tool: onnxruntime

## Usage

```bash
# Show help
onnxruntime --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run onnxruntime -- --help --json

# Introspect command schema
agents-cli schema onnxruntime --json

# Dry-run before executing
agents-cli run onnxruntime -- <args> --dry-run
```
