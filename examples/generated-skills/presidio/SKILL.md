---
name: presidio
version: 0.0.0
description: "CLI tool: presidio. Use this skill whenever the user works with presidio or tasks related to cli tool: presidio — even if they don't mention "presidio" by name."
ingredients:
  - microsoft/presidio
tags:
  - cli
---

# presidio

CLI tool: presidio

## Overview

presidio provides cli tool: presidio. Agents benefit from presidio because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add microsoft/presidio

# Or clone from GitHub
git clone https://github.com/microsoft/presidio.git
```

## Usage

```bash
# Show help and available options
presidio --help

# Check version
presidio --version
```

Refer to the project documentation for detailed usage:
- https://github.com/microsoft/presidio

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add microsoft/presidio

# 2. Verify installation
agents-cli run presidio -- --version

# 3. Explore capabilities
agents-cli schema presidio --json
```

### Piping with other tools

```bash
# Chain presidio output with jq for structured processing
agents-cli run presidio -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run presidio -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run presidio -- --help --json

# Introspect full command schema
agents-cli schema presidio --json

# Dry-run before executing (safe exploration)
agents-cli run presidio -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe presidio --json
```

## When to Use This Tool

Use `presidio` when:
- Your task involves cli tool: presidio
- A task requires presidio-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what presidio provides
