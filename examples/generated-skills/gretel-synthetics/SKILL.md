---
name: gretel-synthetics
version: 0.0.0
description: "CLI tool: gretel-synthetics. Use this skill whenever the user works with gretel-synthetics or tasks related to cli tool: gretel-synthetics — even if they don't mention "gretel-synthetics" by name."
ingredients:
  - gretelai/gretel-synthetics
tags:
  - cli
---

# gretel-synthetics

CLI tool: gretel-synthetics

## Overview

gretel-synthetics provides cli tool: gretel-synthetics. Agents benefit from gretel-synthetics because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add gretelai/gretel-synthetics

# Or clone from GitHub
git clone https://github.com/gretelai/gretel-synthetics.git
```

## Usage

```bash
# Show help and available options
gretel-synthetics --help

# Check version
gretel-synthetics --version
```

Refer to the project documentation for detailed usage:
- https://github.com/gretelai/gretel-synthetics

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add gretelai/gretel-synthetics

# 2. Verify installation
agents-cli run gretel-synthetics -- --version

# 3. Explore capabilities
agents-cli schema gretel-synthetics --json
```

### Piping with other tools

```bash
# Chain gretel-synthetics output with jq for structured processing
agents-cli run gretel-synthetics -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run gretel-synthetics -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run gretel-synthetics -- --help --json

# Introspect full command schema
agents-cli schema gretel-synthetics --json

# Dry-run before executing (safe exploration)
agents-cli run gretel-synthetics -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe gretel-synthetics --json
```

## When to Use This Tool

Use `gretel-synthetics` when:
- Your task involves cli tool: gretel-synthetics
- A task requires gretel-synthetics-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what gretel-synthetics provides
