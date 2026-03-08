---
name: marimo
version: 0.0.0
description: "CLI tool: marimo. Use this skill whenever the user works with marimo or tasks related to cli tool: marimo — even if they don't mention "marimo" by name."
ingredients:
  - marimo-team/marimo
tags:
  - cli
---

# marimo

CLI tool: marimo

## Overview

marimo provides cli tool: marimo. Agents benefit from marimo because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add marimo-team/marimo

# Or clone from GitHub
git clone https://github.com/marimo-team/marimo.git
```

## Usage

```bash
# Show help and available options
marimo --help

# Check version
marimo --version
```

Refer to the project documentation for detailed usage:
- https://github.com/marimo-team/marimo

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add marimo-team/marimo

# 2. Verify installation
agents-cli run marimo -- --version

# 3. Explore capabilities
agents-cli schema marimo --json
```

### Piping with other tools

```bash
# Chain marimo output with jq for structured processing
agents-cli run marimo -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run marimo -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run marimo -- --help --json

# Introspect full command schema
agents-cli schema marimo --json

# Dry-run before executing (safe exploration)
agents-cli run marimo -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe marimo --json
```

## When to Use This Tool

Use `marimo` when:
- Your task involves cli tool: marimo
- A task requires marimo-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what marimo provides
