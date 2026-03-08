---
name: runpod-python
version: 0.0.0
description: "CLI tool: runpod-python. Use this skill whenever the user works with runpod-python or tasks related to cli tool: runpod-python — even if they don't mention "runpod-python" by name."
ingredients:
  - runpod/runpod-python
tags:
  - cli
---

# runpod-python

CLI tool: runpod-python

## Overview

runpod-python provides cli tool: runpod-python. Agents benefit from runpod-python because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add runpod/runpod-python

# Or clone from GitHub
git clone https://github.com/runpod/runpod-python.git
```

## Usage

```bash
# Show help and available options
runpod-python --help

# Check version
runpod-python --version
```

Refer to the project documentation for detailed usage:
- https://github.com/runpod/runpod-python

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add runpod/runpod-python

# 2. Verify installation
agents-cli run runpod-python -- --version

# 3. Explore capabilities
agents-cli schema runpod-python --json
```

### Piping with other tools

```bash
# Chain runpod-python output with jq for structured processing
agents-cli run runpod-python -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run runpod-python -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run runpod-python -- --help --json

# Introspect full command schema
agents-cli schema runpod-python --json

# Dry-run before executing (safe exploration)
agents-cli run runpod-python -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe runpod-python --json
```

## When to Use This Tool

Use `runpod-python` when:
- Your task involves cli tool: runpod-python
- A task requires runpod-python-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what runpod-python provides
