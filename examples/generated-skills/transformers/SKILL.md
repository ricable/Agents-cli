---
name: transformers
version: 0.0.0
description: "CLI tool: transformers. Use this skill whenever the user works with transformers or tasks related to cli tool: transformers — even if they don't mention "transformers" by name."
ingredients:
  - huggingface/transformers
tags:
  - cli
---

# transformers

CLI tool: transformers

## Overview

transformers provides cli tool: transformers. Agents benefit from transformers because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add huggingface/transformers

# Or clone from GitHub
git clone https://github.com/huggingface/transformers.git
```

## Usage

```bash
# Show help and available options
transformers --help

# Check version
transformers --version
```

Refer to the project documentation for detailed usage:
- https://github.com/huggingface/transformers

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add huggingface/transformers

# 2. Verify installation
agents-cli run transformers -- --version

# 3. Explore capabilities
agents-cli schema transformers --json
```

### Piping with other tools

```bash
# Chain transformers output with jq for structured processing
agents-cli run transformers -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run transformers -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run transformers -- --help --json

# Introspect full command schema
agents-cli schema transformers --json

# Dry-run before executing (safe exploration)
agents-cli run transformers -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe transformers --json
```

## When to Use This Tool

Use `transformers` when:
- Your task involves cli tool: transformers
- A task requires transformers-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what transformers provides
