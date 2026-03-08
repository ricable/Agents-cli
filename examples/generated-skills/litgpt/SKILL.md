---
name: litgpt
version: 0.0.0
description: "CLI tool: litgpt. Use this skill whenever the user works with litgpt or tasks related to cli tool: litgpt — even if they don't mention "litgpt" by name."
ingredients:
  - Lightning-AI/litgpt
tags:
  - cli
---

# litgpt

CLI tool: litgpt

## Overview

litgpt provides cli tool: litgpt. Agents benefit from litgpt because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add Lightning-AI/litgpt

# Or clone from GitHub
git clone https://github.com/Lightning-AI/litgpt.git
```

## Usage

```bash
# Show help and available options
litgpt --help

# Check version
litgpt --version
```

Refer to the project documentation for detailed usage:
- https://github.com/Lightning-AI/litgpt

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add Lightning-AI/litgpt

# 2. Verify installation
agents-cli run litgpt -- --version

# 3. Explore capabilities
agents-cli schema litgpt --json
```

### Piping with other tools

```bash
# Chain litgpt output with jq for structured processing
agents-cli run litgpt -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run litgpt -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run litgpt -- --help --json

# Introspect full command schema
agents-cli schema litgpt --json

# Dry-run before executing (safe exploration)
agents-cli run litgpt -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe litgpt --json
```

## When to Use This Tool

Use `litgpt` when:
- Your task involves cli tool: litgpt
- A task requires litgpt-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what litgpt provides
