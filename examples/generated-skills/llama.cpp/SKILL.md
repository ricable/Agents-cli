---
name: llama.cpp
version: 0.0.0
description: "LLM inference in C/C++. Use this skill when working with llama.cpp-related tasks."
ingredients:
  - ggml-org/llama.cpp
tags:
  - ggml
  - cli
# homepage: https://github.com/ggml-org/llama.cpp
# license: MIT
---

# llama.cpp

LLM inference in C/C++

**Source**: https://github.com/ggml-org/llama.cpp

## Usage

```bash
# Show help
llama.cpp --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run llama.cpp -- --help --json

# Introspect command schema
agents-cli schema llama.cpp --json

# Dry-run before executing
agents-cli run llama.cpp -- <args> --dry-run
```
