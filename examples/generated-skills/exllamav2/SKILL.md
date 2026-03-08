---
name: exllamav2
version: 0.0.0
description: "A fast inference library for running LLMs locally on modern consumer-class GPUs. Use this skill when working with exllamav2-related tasks."
ingredients:
  - turboderp-org/exllamav2
tags:
  - cli
# homepage: https://github.com/turboderp-org/exllamav2
# license: MIT
---

# exllamav2

A fast inference library for running LLMs locally on modern consumer-class GPUs

**Source**: https://github.com/turboderp-org/exllamav2

## Usage

```bash
# Show help
exllamav2 --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run exllamav2 -- --help --json

# Introspect command schema
agents-cli schema exllamav2 --json

# Dry-run before executing
agents-cli run exllamav2 -- <args> --dry-run
```
