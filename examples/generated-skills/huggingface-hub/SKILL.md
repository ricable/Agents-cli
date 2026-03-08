---
name: huggingface_hub
version: 0.0.0
description: "CLI tool: huggingface_hub. Use this skill whenever the user works with huggingface_hub or tasks related to cli tool: huggingface_hub — even if they don't mention "huggingface_hub" by name."
ingredients:
  - huggingface/huggingface_hub
tags:
  - cli
---

# huggingface_hub

CLI tool: huggingface_hub

## Overview

huggingface_hub provides cli tool: huggingface_hub. Agents benefit from huggingface_hub because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add huggingface/huggingface_hub

# Or clone from GitHub
git clone https://github.com/huggingface/huggingface_hub.git
```

## Usage

```bash
# Show help and available options
huggingface_hub --help

# Check version
huggingface_hub --version
```

Refer to the project documentation for detailed usage:
- https://github.com/huggingface/huggingface_hub

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add huggingface/huggingface_hub

# 2. Verify installation
agents-cli run huggingface_hub -- --version

# 3. Explore capabilities
agents-cli schema huggingface_hub --json
```

### Piping with other tools

```bash
# Chain huggingface_hub output with jq for structured processing
agents-cli run huggingface_hub -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run huggingface_hub -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run huggingface_hub -- --help --json

# Introspect full command schema
agents-cli schema huggingface_hub --json

# Dry-run before executing (safe exploration)
agents-cli run huggingface_hub -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe huggingface_hub --json
```

## When to Use This Tool

Use `huggingface_hub` when:
- Your task involves cli tool: huggingface_hub
- A task requires huggingface_hub-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what huggingface_hub provides
