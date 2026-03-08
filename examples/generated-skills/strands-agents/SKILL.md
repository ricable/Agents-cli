---
name: sdk-python
version: 0.0.0
description: "CLI tool: sdk-python. Use this skill whenever the user works with sdk-python or tasks related to cli tool: sdk-python — even if they don't mention "sdk-python" by name."
ingredients:
  - strands-agents/sdk-python
tags:
  - cli
---

# sdk-python

CLI tool: sdk-python

## Overview

sdk-python provides cli tool: sdk-python. Agents benefit from sdk-python because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add strands-agents/sdk-python

# Or clone from GitHub
git clone https://github.com/strands-agents/sdk-python.git
```

## Usage

```bash
# Show help and available options
sdk-python --help

# Check version
sdk-python --version
```

Refer to the project documentation for detailed usage:
- https://github.com/strands-agents/sdk-python

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add strands-agents/sdk-python

# 2. Verify installation
agents-cli run sdk-python -- --version

# 3. Explore capabilities
agents-cli schema sdk-python --json
```

### Piping with other tools

```bash
# Chain sdk-python output with jq for structured processing
agents-cli run sdk-python -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run sdk-python -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run sdk-python -- --help --json

# Introspect full command schema
agents-cli schema sdk-python --json

# Dry-run before executing (safe exploration)
agents-cli run sdk-python -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe sdk-python --json
```

## When to Use This Tool

Use `sdk-python` when:
- Your task involves cli tool: sdk-python
- A task requires sdk-python-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what sdk-python provides
