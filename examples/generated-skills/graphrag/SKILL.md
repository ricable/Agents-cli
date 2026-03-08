---
name: graphrag
version: 0.0.0
description: "CLI tool: graphrag. Use this skill whenever the user works with graphrag or tasks related to cli tool: graphrag — even if they don't mention "graphrag" by name."
ingredients:
  - microsoft/graphrag
tags:
  - cli
---

# graphrag

CLI tool: graphrag

## Overview

graphrag provides cli tool: graphrag. Agents benefit from graphrag because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add microsoft/graphrag

# Or clone from GitHub
git clone https://github.com/microsoft/graphrag.git
```

## Usage

```bash
# Show help and available options
graphrag --help

# Check version
graphrag --version
```

Refer to the project documentation for detailed usage:
- https://github.com/microsoft/graphrag

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add microsoft/graphrag

# 2. Verify installation
agents-cli run graphrag -- --version

# 3. Explore capabilities
agents-cli schema graphrag --json
```

### Piping with other tools

```bash
# Chain graphrag output with jq for structured processing
agents-cli run graphrag -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run graphrag -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run graphrag -- --help --json

# Introspect full command schema
agents-cli schema graphrag --json

# Dry-run before executing (safe exploration)
agents-cli run graphrag -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe graphrag --json
```

## When to Use This Tool

Use `graphrag` when:
- Your task involves cli tool: graphrag
- A task requires graphrag-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what graphrag provides
