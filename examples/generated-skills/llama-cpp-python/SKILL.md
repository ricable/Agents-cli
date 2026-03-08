---
name: llama-cpp-python
version: 0.0.0
description: "CLI tool: llama-cpp-python. Use this skill whenever the user works with llama-cpp-python or tasks related to cli tool: llama-cpp-python — even if they don't mention "llama-cpp-python" by name."
ingredients:
  - abetlen/llama-cpp-python
tags:
  - cli
---

# llama-cpp-python

CLI tool: llama-cpp-python

## Overview

llama-cpp-python provides cli tool: llama-cpp-python. Agents benefit from llama-cpp-python because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add abetlen/llama-cpp-python

# Or clone from GitHub
git clone https://github.com/abetlen/llama-cpp-python.git
```

## Usage

```bash
# Show help and available options
llama-cpp-python --help

# Check version
llama-cpp-python --version
```

Refer to the project documentation for detailed usage:
- https://github.com/abetlen/llama-cpp-python

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add abetlen/llama-cpp-python

# 2. Verify installation
agents-cli run llama-cpp-python -- --version

# 3. Explore capabilities
agents-cli schema llama-cpp-python --json
```

### Piping with other tools

```bash
# Chain llama-cpp-python output with jq for structured processing
agents-cli run llama-cpp-python -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run llama-cpp-python -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run llama-cpp-python -- --help --json

# Introspect full command schema
agents-cli schema llama-cpp-python --json

# Dry-run before executing (safe exploration)
agents-cli run llama-cpp-python -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe llama-cpp-python --json
```

## When to Use This Tool

Use `llama-cpp-python` when:
- Your task involves cli tool: llama-cpp-python
- A task requires llama-cpp-python-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what llama-cpp-python provides
