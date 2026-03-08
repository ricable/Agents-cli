---
name: safetensors
version: 0.0.0
description: "Simple, safe way to store and distribute tensors. Use this skill whenever the user works with safetensors or tasks related to simple, safe way to store and distribute tensors — even if they don't mention "safetensors" by name."
ingredients:
  - huggingface/safetensors
tags:
  - cli
# homepage: https://huggingface.co/docs/safetensors
# license: Apache-2.0
---

# safetensors

Simple, safe way to store and distribute tensors

**Source**: https://huggingface.co/docs/safetensors

## Overview

safetensors provides simple, safe way to store and distribute tensors. Agents benefit from safetensors because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add huggingface/safetensors

# Or clone from GitHub
git clone https://github.com/huggingface/safetensors.git
```

## Usage

```bash
# Show help and available options
safetensors --help

# Check version
safetensors --version
```

Refer to the project documentation for detailed usage:
- https://huggingface.co/docs/safetensors

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add huggingface/safetensors

# 2. Verify installation
agents-cli run safetensors -- --version

# 3. Explore capabilities
agents-cli schema safetensors --json
```

### Piping with other tools

```bash
# Chain safetensors output with jq for structured processing
agents-cli run safetensors -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run safetensors -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run safetensors -- --help --json

# Introspect full command schema
agents-cli schema safetensors --json

# Dry-run before executing (safe exploration)
agents-cli run safetensors -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe safetensors --json
```

## When to Use This Tool

Use `safetensors` when:
- Your task involves simple, safe way to store and distribute tensors
- A task requires safetensors-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what safetensors provides
