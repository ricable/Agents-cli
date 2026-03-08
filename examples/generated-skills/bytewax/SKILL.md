---
name: bytewax
version: 0.0.0
description: "CLI tool: bytewax. Use this skill whenever the user works with bytewax or tasks related to cli tool: bytewax — even if they don't mention "bytewax" by name."
ingredients:
  - bytewax/bytewax
tags:
  - cli
---

# bytewax

CLI tool: bytewax

## Overview

bytewax provides cli tool: bytewax. Agents benefit from bytewax because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add bytewax/bytewax

# Or clone from GitHub
git clone https://github.com/bytewax/bytewax.git
```

## Usage

```bash
# Show help and available options
bytewax --help

# Check version
bytewax --version
```

Refer to the project documentation for detailed usage:
- https://github.com/bytewax/bytewax

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add bytewax/bytewax

# 2. Verify installation
agents-cli run bytewax -- --version

# 3. Explore capabilities
agents-cli schema bytewax --json
```

### Piping with other tools

```bash
# Chain bytewax output with jq for structured processing
agents-cli run bytewax -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run bytewax -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run bytewax -- --help --json

# Introspect full command schema
agents-cli schema bytewax --json

# Dry-run before executing (safe exploration)
agents-cli run bytewax -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe bytewax --json
```

## When to Use This Tool

Use `bytewax` when:
- Your task involves cli tool: bytewax
- A task requires bytewax-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what bytewax provides
