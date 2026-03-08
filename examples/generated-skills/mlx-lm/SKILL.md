---
name: mlx-examples
version: 0.0.0
description: "Examples in the MLX framework. Use this skill when working with mlx-examples-related tasks."
ingredients:
  - ml-explore/mlx-examples
tags:
  - mlx
  - cli
# homepage: https://github.com/ml-explore/mlx-examples
# license: MIT
---

# mlx-examples

Examples in the MLX framework

**Source**: https://github.com/ml-explore/mlx-examples

## Usage

```bash
# Show help
mlx-examples --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run mlx-examples -- --help --json

# Introspect command schema
agents-cli schema mlx-examples --json

# Dry-run before executing
agents-cli run mlx-examples -- <args> --dry-run
```
