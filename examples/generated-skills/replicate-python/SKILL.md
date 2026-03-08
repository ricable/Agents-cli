---
name: replicate-python
version: 0.0.0
description: "CLI tool: replicate-python. Use this skill whenever the user works with replicate-python or tasks related to cli tool: replicate-python — even if they don't mention "replicate-python" by name."
ingredients:
  - replicate/replicate-python
tags:
  - cli
---

# replicate-python

CLI tool: replicate-python

## Overview

replicate-python provides cli tool: replicate-python. Agents benefit from replicate-python because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add replicate/replicate-python

# Or clone from GitHub
git clone https://github.com/replicate/replicate-python.git
```

## Usage

```bash
# Show help and available options
replicate-python --help

# Check version
replicate-python --version
```

Refer to the project documentation for detailed usage:
- https://github.com/replicate/replicate-python

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add replicate/replicate-python

# 2. Verify installation
agents-cli run replicate-python -- --version

# 3. Explore capabilities
agents-cli schema replicate-python --json
```

### Piping with other tools

```bash
# Chain replicate-python output with jq for structured processing
agents-cli run replicate-python -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run replicate-python -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run replicate-python -- --help --json

# Introspect full command schema
agents-cli schema replicate-python --json

# Dry-run before executing (safe exploration)
agents-cli run replicate-python -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe replicate-python --json
```

## When to Use This Tool

Use `replicate-python` when:
- Your task involves cli tool: replicate-python
- A task requires replicate-python-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what replicate-python provides
