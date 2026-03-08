---
name: click
version: 0.0.0
description: "CLI tool: click. Use this skill whenever the user works with click or tasks related to cli tool: click — even if they don't mention "click" by name."
ingredients:
  - pallets/click
tags:
  - cli
---

# click

CLI tool: click

## Overview

click provides cli tool: click. Agents benefit from click because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add pallets/click

# Or clone from GitHub
git clone https://github.com/pallets/click.git
```

## Usage

```bash
# Show help and available options
click --help

# Check version
click --version
```

Refer to the project documentation for detailed usage:
- https://github.com/pallets/click

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add pallets/click

# 2. Verify installation
agents-cli run click -- --version

# 3. Explore capabilities
agents-cli schema click --json
```

### Piping with other tools

```bash
# Chain click output with jq for structured processing
agents-cli run click -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run click -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run click -- --help --json

# Introspect full command schema
agents-cli schema click --json

# Dry-run before executing (safe exploration)
agents-cli run click -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe click --json
```

## When to Use This Tool

Use `click` when:
- Your task involves cli tool: click
- A task requires click-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what click provides
