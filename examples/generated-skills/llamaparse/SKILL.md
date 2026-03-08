---
name: llama_parse
version: 0.0.1
description: "CLI tool: llama_parse. Use this skill whenever the user works with llama_parse or tasks related to cli tool: llama_parse — even if they don't mention "llama_parse" by name."
ingredients:
  - run-llama/llama_parse
tags:
  - cli
---

# llama_parse

CLI tool: llama_parse

## Overview

llama_parse provides cli tool: llama_parse. Agents benefit from llama_parse because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add run-llama/llama_parse

# Or clone from GitHub
git clone https://github.com/run-llama/llama_parse.git
```

## Usage

```bash
# Show help and available options
llama_parse --help

# Check version
llama_parse --version
```

Refer to the project documentation for detailed usage:
- https://github.com/run-llama/llama_parse

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add run-llama/llama_parse

# 2. Verify installation
agents-cli run llama_parse -- --version

# 3. Explore capabilities
agents-cli schema llama_parse --json
```

### Piping with other tools

```bash
# Chain llama_parse output with jq for structured processing
agents-cli run llama_parse -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run llama_parse -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run llama_parse -- --help --json

# Introspect full command schema
agents-cli schema llama_parse --json

# Dry-run before executing (safe exploration)
agents-cli run llama_parse -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe llama_parse --json
```

## When to Use This Tool

Use `llama_parse` when:
- Your task involves cli tool: llama_parse
- A task requires llama_parse-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what llama_parse provides
