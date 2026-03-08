---
name: garak
version: 0.0.0
description: "CLI tool: garak. Use this skill whenever the user works with garak or tasks related to cli tool: garak — even if they don't mention "garak" by name."
ingredients:
  - NVIDIA/garak
tags:
  - cli
---

# garak

CLI tool: garak

## Overview

garak provides cli tool: garak. Agents benefit from garak because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add NVIDIA/garak

# Or clone from GitHub
git clone https://github.com/NVIDIA/garak.git
```

## Usage

```bash
# Show help and available options
garak --help

# Check version
garak --version
```

Refer to the project documentation for detailed usage:
- https://github.com/NVIDIA/garak

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add NVIDIA/garak

# 2. Verify installation
agents-cli run garak -- --version

# 3. Explore capabilities
agents-cli schema garak --json
```

### Piping with other tools

```bash
# Chain garak output with jq for structured processing
agents-cli run garak -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run garak -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run garak -- --help --json

# Introspect full command schema
agents-cli schema garak --json

# Dry-run before executing (safe exploration)
agents-cli run garak -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe garak --json
```

## When to Use This Tool

Use `garak` when:
- Your task involves cli tool: garak
- A task requires garak-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what garak provides
