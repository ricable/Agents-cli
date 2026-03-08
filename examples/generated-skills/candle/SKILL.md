---
name: candle
version: 0.0.0
description: "Minimalist ML framework for Rust. Use this skill whenever the user works with candle or tasks related to minimalist ml framework for rust — even if they don't mention "candle" by name."
ingredients:
  - huggingface/candle
tags:
  - cli
# homepage: https://github.com/huggingface/candle
# license: Apache-2.0
---

# candle

Minimalist ML framework for Rust

**Source**: https://github.com/huggingface/candle

## Overview

candle provides minimalist ml framework for rust. Agents benefit from candle because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add huggingface/candle

# Or clone from GitHub
git clone https://github.com/huggingface/candle.git
```

## Usage

```bash
# Show help and available options
candle --help

# Check version
candle --version
```

Refer to the project documentation for detailed usage:
- https://github.com/huggingface/candle

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add huggingface/candle

# 2. Verify installation
agents-cli run candle -- --version

# 3. Explore capabilities
agents-cli schema candle --json
```

### Piping with other tools

```bash
# Chain candle output with jq for structured processing
agents-cli run candle -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run candle -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run candle -- --help --json

# Introspect full command schema
agents-cli schema candle --json

# Dry-run before executing (safe exploration)
agents-cli run candle -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe candle --json
```

## When to Use This Tool

Use `candle` when:
- Your task involves minimalist ml framework for rust
- A task requires candle-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what candle provides
