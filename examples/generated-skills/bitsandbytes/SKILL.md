---
name: bitsandbytes
version: 0.0.0
description: "Accessible large language models via k-bit quantization for PyTorch.. Use this skill whenever the user works with bitsandbytes or tasks related to accessible large language models via k-bit quantization for pytorch — even if they don't mention "bitsandbytes" by name."
ingredients:
  - bitsandbytes-foundation/bitsandbytes
tags:
  - llm
  - machine-learning
  - pytorch
  - qlora
  - quantization
  - cli
# homepage: https://huggingface.co/docs/bitsandbytes/main/en/index
# license: MIT
---

# bitsandbytes

Accessible large language models via k-bit quantization for PyTorch.

**Source**: https://huggingface.co/docs/bitsandbytes/main/en/index

## Overview

bitsandbytes provides accessible large language models via k-bit quantization for pytorch. Agents benefit from bitsandbytes because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add bitsandbytes-foundation/bitsandbytes

# Or clone from GitHub
git clone https://github.com/bitsandbytes-foundation/bitsandbytes.git
```

## Usage

```bash
# Show help and available options
bitsandbytes --help

# Check version
bitsandbytes --version
```

Refer to the project documentation for detailed usage:
- https://huggingface.co/docs/bitsandbytes/main/en/index

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add bitsandbytes-foundation/bitsandbytes

# 2. Verify installation
agents-cli run bitsandbytes -- --version

# 3. Explore capabilities
agents-cli schema bitsandbytes --json
```

### Piping with other tools

```bash
# Chain bitsandbytes output with jq for structured processing
agents-cli run bitsandbytes -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run bitsandbytes -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run bitsandbytes -- --help --json

# Introspect full command schema
agents-cli schema bitsandbytes --json

# Dry-run before executing (safe exploration)
agents-cli run bitsandbytes -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe bitsandbytes --json
```

## When to Use This Tool

Use `bitsandbytes` when:
- Your task involves accessible large language models via k-bit quantization for pytorch
- A task requires bitsandbytes-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what bitsandbytes provides
