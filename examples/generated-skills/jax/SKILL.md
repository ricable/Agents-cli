---
name: jax
version: 0.0.0
description: "CLI tool: jax. Use this skill when working with jax-related tasks."
ingredients:
  - jax-ml/jax
tags:
  - cli
---

# jax

CLI tool: jax

## Usage

```bash
# Show help
jax --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run jax -- --help --json

# Introspect command schema
agents-cli schema jax --json

# Dry-run before executing
agents-cli run jax -- <args> --dry-run
```
