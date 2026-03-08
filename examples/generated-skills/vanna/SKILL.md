---
name: vanna
version: 0.0.0
description: "CLI tool: vanna. Use this skill whenever the user works with vanna or tasks related to cli tool: vanna — even if they don't mention "vanna" by name."
ingredients:
  - vanna-ai/vanna
tags:
  - cli
---

# vanna

CLI tool: vanna

## Overview

vanna provides cli tool: vanna. Agents benefit from vanna because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add vanna-ai/vanna

# Or clone from GitHub
git clone https://github.com/vanna-ai/vanna.git
```

## Usage

```bash
# Show help and available options
vanna --help

# Check version
vanna --version
```

Refer to the project documentation for detailed usage:
- https://github.com/vanna-ai/vanna

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add vanna-ai/vanna

# 2. Verify installation
agents-cli run vanna -- --version

# 3. Explore capabilities
agents-cli schema vanna --json
```

### Piping with other tools

```bash
# Chain vanna output with jq for structured processing
agents-cli run vanna -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run vanna -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run vanna -- --help --json

# Introspect full command schema
agents-cli schema vanna --json

# Dry-run before executing (safe exploration)
agents-cli run vanna -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe vanna --json
```

## When to Use This Tool

Use `vanna` when:
- Your task involves cli tool: vanna
- A task requires vanna-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what vanna provides
