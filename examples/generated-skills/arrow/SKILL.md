---
name: arrow
version: 0.0.0
description: "CLI tool: arrow. Use this skill whenever the user works with arrow or tasks related to cli tool: arrow — even if they don't mention "arrow" by name."
ingredients:
  - apache/arrow
tags:
  - cli
---

# arrow

CLI tool: arrow

## Overview

arrow provides cli tool: arrow. Agents benefit from arrow because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add apache/arrow

# Or clone from GitHub
git clone https://github.com/apache/arrow.git
```

## Usage

```bash
# Show help and available options
arrow --help

# Check version
arrow --version
```

Refer to the project documentation for detailed usage:
- https://github.com/apache/arrow

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add apache/arrow

# 2. Verify installation
agents-cli run arrow -- --version

# 3. Explore capabilities
agents-cli schema arrow --json
```

### Piping with other tools

```bash
# Chain arrow output with jq for structured processing
agents-cli run arrow -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run arrow -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run arrow -- --help --json

# Introspect full command schema
agents-cli schema arrow --json

# Dry-run before executing (safe exploration)
agents-cli run arrow -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe arrow --json
```

## When to Use This Tool

Use `arrow` when:
- Your task involves cli tool: arrow
- A task requires arrow-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what arrow provides
