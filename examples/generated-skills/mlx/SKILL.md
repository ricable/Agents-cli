---
name: mlx
version: 0.0.0
description: "MLX: An array framework for Apple silicon. Use this skill whenever the user works with mlx or tasks related to mlx: an array framework for apple silicon — even if they don't mention "mlx" by name."
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

## Overview

mlx provides mlx: an array framework for apple silicon. Agents benefit from mlx because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add ml-explore/mlx

# Or clone from GitHub
git clone https://github.com/ml-explore/mlx.git
```

## Usage

```bash
# Show help and available options
mlx --help

# Check version
mlx --version
```

Refer to the project documentation for detailed usage:
- https://ml-explore.github.io/mlx/

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add ml-explore/mlx

# 2. Verify installation
agents-cli run mlx -- --version

# 3. Explore capabilities
agents-cli schema mlx --json
```

### Piping with other tools

```bash
# Chain mlx output with jq for structured processing
agents-cli run mlx -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run mlx -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run mlx -- --help --json

# Introspect full command schema
agents-cli schema mlx --json

# Dry-run before executing (safe exploration)
agents-cli run mlx -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe mlx --json
```

## When to Use This Tool

Use `mlx` when:
- Your task involves mlx: an array framework for apple silicon
- A task requires mlx-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what mlx provides
