---
name: fastembed
version: 0.0.0
description: "CLI tool: fastembed. Use this skill whenever the user works with fastembed or tasks related to cli tool: fastembed — even if they don't mention "fastembed" by name."
ingredients:
  - qdrant/fastembed
tags:
  - cli
---

# fastembed

CLI tool: fastembed

## Overview

fastembed provides cli tool: fastembed. Agents benefit from fastembed because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add qdrant/fastembed

# Or clone from GitHub
git clone https://github.com/qdrant/fastembed.git
```

## Usage

```bash
# Show help and available options
fastembed --help

# Check version
fastembed --version
```

Refer to the project documentation for detailed usage:
- https://github.com/qdrant/fastembed

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add qdrant/fastembed

# 2. Verify installation
agents-cli run fastembed -- --version

# 3. Explore capabilities
agents-cli schema fastembed --json
```

### Piping with other tools

```bash
# Chain fastembed output with jq for structured processing
agents-cli run fastembed -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run fastembed -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run fastembed -- --help --json

# Introspect full command schema
agents-cli schema fastembed --json

# Dry-run before executing (safe exploration)
agents-cli run fastembed -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe fastembed --json
```

## When to Use This Tool

Use `fastembed` when:
- Your task involves cli tool: fastembed
- A task requires fastembed-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what fastembed provides
