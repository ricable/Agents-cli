---
name: llm-awq
version: 0.0.0
description: "[MLSys 2024 Best Paper Award] AWQ: Activation-aware Weight Quantization for LLM Compression and Acceleration. Use this skill whenever the user works with llm-awq or tasks related to [mlsys 2024 best paper award] awq: activation-aware weight quantization for llm compression and acceleration — even if they don't mention "llm-awq" by name."
ingredients:
  - mit-han-lab/llm-awq
tags:
  - cli
# homepage: https://github.com/mit-han-lab/llm-awq
# license: MIT
---

# llm-awq

[MLSys 2024 Best Paper Award] AWQ: Activation-aware Weight Quantization for LLM Compression and Acceleration

**Source**: https://github.com/mit-han-lab/llm-awq

## Overview

llm-awq provides [mlsys 2024 best paper award] awq: activation-aware weight quantization for llm compression and acceleration. Agents benefit from llm-awq because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add mit-han-lab/llm-awq

# Or clone from GitHub
git clone https://github.com/mit-han-lab/llm-awq.git
```

## Usage

```bash
# Show help and available options
llm-awq --help

# Check version
llm-awq --version
```

Refer to the project documentation for detailed usage:
- https://github.com/mit-han-lab/llm-awq

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add mit-han-lab/llm-awq

# 2. Verify installation
agents-cli run llm-awq -- --version

# 3. Explore capabilities
agents-cli schema llm-awq --json
```

### Piping with other tools

```bash
# Chain llm-awq output with jq for structured processing
agents-cli run llm-awq -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run llm-awq -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run llm-awq -- --help --json

# Introspect full command schema
agents-cli schema llm-awq --json

# Dry-run before executing (safe exploration)
agents-cli run llm-awq -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe llm-awq --json
```

## When to Use This Tool

Use `llm-awq` when:
- Your task involves [mlsys 2024 best paper award] awq: activation-aware weight quantization for llm compression and acceleration
- A task requires llm-awq-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what llm-awq provides
