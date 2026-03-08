---
name: mlx
version: 0.0.0
description: "MLX: An array framework for Apple silicon. Use this skill when working with mlx-related tasks."
ingredients:
  - ml-explore/mlx
tags:
  - mlx
  - cli
# homepage: https://ml-explore.github.io/mlx/
# license: MIT
---

# mlx

MLX: An array framework for Apple silicon

**Source**: https://ml-explore.github.io/mlx/

## Usage

```bash
# Show help
mlx --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run mlx -- --help --json

# Introspect command schema
agents-cli schema mlx --json

# Dry-run before executing
agents-cli run mlx -- <args> --dry-run
```
