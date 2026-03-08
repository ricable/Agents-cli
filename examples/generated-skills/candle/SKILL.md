---
name: candle
version: 0.0.0
description: "Minimalist ML framework for Rust. Use this skill when working with candle-related tasks."
ingredients:
  - huggingface/candle
tags:
  - cli
# homepage: https://github.com/huggingface/candle
# license: Apache-2.0
---

# candle

Minimalist ML framework for Rust

**Source**: https://github.com/huggingface/candle

## Usage

```bash
# Show help
candle --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run candle -- --help --json

# Introspect command schema
agents-cli schema candle --json

# Dry-run before executing
agents-cli run candle -- <args> --dry-run
```
