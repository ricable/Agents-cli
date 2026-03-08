---
name: doctr
version: 0.0.0
description: "CLI tool: doctr. Use this skill whenever the user works with doctr or tasks related to cli tool: doctr — even if they don't mention "doctr" by name."
ingredients:
  - mindee/doctr
tags:
  - cli
---

# doctr

CLI tool: doctr

## Overview

doctr provides cli tool: doctr. Agents benefit from doctr because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add mindee/doctr

# Or clone from GitHub
git clone https://github.com/mindee/doctr.git
```

## Usage

```bash
# Show help and available options
doctr --help

# Check version
doctr --version
```

Refer to the project documentation for detailed usage:
- https://github.com/mindee/doctr

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add mindee/doctr

# 2. Verify installation
agents-cli run doctr -- --version

# 3. Explore capabilities
agents-cli schema doctr --json
```

### Piping with other tools

```bash
# Chain doctr output with jq for structured processing
agents-cli run doctr -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run doctr -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run doctr -- --help --json

# Introspect full command schema
agents-cli schema doctr --json

# Dry-run before executing (safe exploration)
agents-cli run doctr -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe doctr --json
```

## When to Use This Tool

Use `doctr` when:
- Your task involves cli tool: doctr
- A task requires doctr-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what doctr provides
