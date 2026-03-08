---
name: mlc-llm
version: 0.0.0
description: "Universal LLM Deployment Engine with ML Compilation. Use this skill whenever the user works with mlc-llm or tasks related to universal llm deployment engine with ml compilation — even if they don't mention "mlc-llm" by name."
ingredients:
  - mlc-ai/mlc-llm
tags:
  - language-model
  - llm
  - machine-learning-compilation
  - tvm
  - cli
# homepage: https://llm.mlc.ai/
# license: Apache-2.0
---

# mlc-llm

Universal LLM Deployment Engine with ML Compilation

**Source**: https://llm.mlc.ai/

## Overview

mlc-llm provides universal llm deployment engine with ml compilation. Agents benefit from mlc-llm because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add mlc-ai/mlc-llm

# Or clone from GitHub
git clone https://github.com/mlc-ai/mlc-llm.git
```

## Usage

```bash
# Show help and available options
mlc-llm --help

# Check version
mlc-llm --version
```

Refer to the project documentation for detailed usage:
- https://llm.mlc.ai/

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add mlc-ai/mlc-llm

# 2. Verify installation
agents-cli run mlc-llm -- --version

# 3. Explore capabilities
agents-cli schema mlc-llm --json
```

### Piping with other tools

```bash
# Chain mlc-llm output with jq for structured processing
agents-cli run mlc-llm -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run mlc-llm -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run mlc-llm -- --help --json

# Introspect full command schema
agents-cli schema mlc-llm --json

# Dry-run before executing (safe exploration)
agents-cli run mlc-llm -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe mlc-llm --json
```

## When to Use This Tool

Use `mlc-llm` when:
- Your task involves universal llm deployment engine with ml compilation
- A task requires mlc-llm-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what mlc-llm provides
