---
name: PyRIT
version: 0.0.0
description: "CLI tool: PyRIT. Use this skill whenever the user works with PyRIT or tasks related to cli tool: pyrit — even if they don't mention "PyRIT" by name."
ingredients:
  - Azure/PyRIT
tags:
  - cli
---

# PyRIT

CLI tool: PyRIT

## Overview

PyRIT provides cli tool: pyrit. Agents benefit from PyRIT because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add Azure/PyRIT

# Or clone from GitHub
git clone https://github.com/Azure/PyRIT.git
```

## Usage

```bash
# Show help and available options
PyRIT --help

# Check version
PyRIT --version
```

Refer to the project documentation for detailed usage:
- https://github.com/Azure/PyRIT

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add Azure/PyRIT

# 2. Verify installation
agents-cli run PyRIT -- --version

# 3. Explore capabilities
agents-cli schema PyRIT --json
```

### Piping with other tools

```bash
# Chain PyRIT output with jq for structured processing
agents-cli run PyRIT -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run PyRIT -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run PyRIT -- --help --json

# Introspect full command schema
agents-cli schema PyRIT --json

# Dry-run before executing (safe exploration)
agents-cli run PyRIT -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe PyRIT --json
```

## When to Use This Tool

Use `PyRIT` when:
- Your task involves cli tool: pyrit
- A task requires PyRIT-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what PyRIT provides
