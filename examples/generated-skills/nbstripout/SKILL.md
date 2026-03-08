---
name: nbstripout
version: 0.0.0
description: "CLI tool: nbstripout. Use this skill whenever the user works with nbstripout or tasks related to cli tool: nbstripout — even if they don't mention "nbstripout" by name."
ingredients:
  - kynan/nbstripout
tags:
  - cli
---

# nbstripout

CLI tool: nbstripout

## Overview

nbstripout provides cli tool: nbstripout. Agents benefit from nbstripout because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add kynan/nbstripout

# Or clone from GitHub
git clone https://github.com/kynan/nbstripout.git
```

## Usage

```bash
# Show help and available options
nbstripout --help

# Check version
nbstripout --version
```

Refer to the project documentation for detailed usage:
- https://github.com/kynan/nbstripout

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add kynan/nbstripout

# 2. Verify installation
agents-cli run nbstripout -- --version

# 3. Explore capabilities
agents-cli schema nbstripout --json
```

### Piping with other tools

```bash
# Chain nbstripout output with jq for structured processing
agents-cli run nbstripout -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run nbstripout -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run nbstripout -- --help --json

# Introspect full command schema
agents-cli schema nbstripout --json

# Dry-run before executing (safe exploration)
agents-cli run nbstripout -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe nbstripout --json
```

## When to Use This Tool

Use `nbstripout` when:
- Your task involves cli tool: nbstripout
- A task requires nbstripout-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what nbstripout provides
