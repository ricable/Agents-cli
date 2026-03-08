---
name: mlx-examples
version: 0.0.0
description: "Examples in the MLX framework. Use this skill whenever the user works with mlx-examples or tasks related to examples in the mlx framework — even if they don't mention "mlx-examples" by name."
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

## Overview

mlx-examples provides examples in the mlx framework. Agents benefit from mlx-examples because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add ml-explore/mlx-examples

# Or clone from GitHub
git clone https://github.com/ml-explore/mlx-examples.git
```

## Usage

```bash
# Show help and available options
mlx-examples --help

# Check version
mlx-examples --version
```

Refer to the project documentation for detailed usage:
- https://github.com/ml-explore/mlx-examples

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add ml-explore/mlx-examples

# 2. Verify installation
agents-cli run mlx-examples -- --version

# 3. Explore capabilities
agents-cli schema mlx-examples --json
```

### Piping with other tools

```bash
# Chain mlx-examples output with jq for structured processing
agents-cli run mlx-examples -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run mlx-examples -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run mlx-examples -- --help --json

# Introspect full command schema
agents-cli schema mlx-examples --json

# Dry-run before executing (safe exploration)
agents-cli run mlx-examples -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe mlx-examples --json
```

## When to Use This Tool

Use `mlx-examples` when:
- Your task involves examples in the mlx framework
- A task requires mlx-examples-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what mlx-examples provides
