---
name: llama_index
version: 0.0.0
description: "CLI tool: llama_index. Use this skill whenever the user works with llama_index or tasks related to cli tool: llama_index — even if they don't mention "llama_index" by name."
ingredients:
  - run-llama/llama_index
tags:
  - cli
---

# llama_index

CLI tool: llama_index

## Overview

llama_index provides cli tool: llama_index. Agents benefit from llama_index because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add run-llama/llama_index

# Or clone from GitHub
git clone https://github.com/run-llama/llama_index.git
```

## Usage

```bash
# Show help and available options
llama_index --help

# Check version
llama_index --version
```

Refer to the project documentation for detailed usage:
- https://github.com/run-llama/llama_index

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add run-llama/llama_index

# 2. Verify installation
agents-cli run llama_index -- --version

# 3. Explore capabilities
agents-cli schema llama_index --json
```

### Piping with other tools

```bash
# Chain llama_index output with jq for structured processing
agents-cli run llama_index -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run llama_index -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run llama_index -- --help --json

# Introspect full command schema
agents-cli schema llama_index --json

# Dry-run before executing (safe exploration)
agents-cli run llama_index -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe llama_index --json
```

## When to Use This Tool

Use `llama_index` when:
- Your task involves cli tool: llama_index
- A task requires llama_index-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what llama_index provides
