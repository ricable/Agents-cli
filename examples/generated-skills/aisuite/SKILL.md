---
name: aisuite
version: 0.0.0
description: "CLI tool: aisuite. Use this skill whenever the user works with aisuite or tasks related to cli tool: aisuite — even if they don't mention "aisuite" by name."
ingredients:
  - andrewyng/aisuite
tags:
  - cli
---

# aisuite

CLI tool: aisuite

## Overview

aisuite provides cli tool: aisuite. Agents benefit from aisuite because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add andrewyng/aisuite

# Or clone from GitHub
git clone https://github.com/andrewyng/aisuite.git
```

## Usage

```bash
# Show help and available options
aisuite --help

# Check version
aisuite --version
```

Refer to the project documentation for detailed usage:
- https://github.com/andrewyng/aisuite

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add andrewyng/aisuite

# 2. Verify installation
agents-cli run aisuite -- --version

# 3. Explore capabilities
agents-cli schema aisuite --json
```

### Piping with other tools

```bash
# Chain aisuite output with jq for structured processing
agents-cli run aisuite -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run aisuite -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run aisuite -- --help --json

# Introspect full command schema
agents-cli schema aisuite --json

# Dry-run before executing (safe exploration)
agents-cli run aisuite -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe aisuite --json
```

## When to Use This Tool

Use `aisuite` when:
- Your task involves cli tool: aisuite
- A task requires aisuite-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what aisuite provides
