---
name: quarto-cli
version: 0.0.0
description: "CLI tool: quarto-cli. Use this skill whenever the user works with quarto-cli or tasks related to cli tool: quarto-cli — even if they don't mention "quarto-cli" by name."
ingredients:
  - quarto-dev/quarto-cli
tags:
  - cli
---

# quarto-cli

CLI tool: quarto-cli

## Overview

quarto-cli provides cli tool: quarto-cli. Agents benefit from quarto-cli because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add quarto-dev/quarto-cli

# Or clone from GitHub
git clone https://github.com/quarto-dev/quarto-cli.git
```

## Usage

```bash
# Show help and available options
quarto-cli --help

# Check version
quarto-cli --version
```

Refer to the project documentation for detailed usage:
- https://github.com/quarto-dev/quarto-cli

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add quarto-dev/quarto-cli

# 2. Verify installation
agents-cli run quarto-cli -- --version

# 3. Explore capabilities
agents-cli schema quarto-cli --json
```

### Piping with other tools

```bash
# Chain quarto-cli output with jq for structured processing
agents-cli run quarto-cli -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run quarto-cli -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run quarto-cli -- --help --json

# Introspect full command schema
agents-cli schema quarto-cli --json

# Dry-run before executing (safe exploration)
agents-cli run quarto-cli -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe quarto-cli --json
```

## When to Use This Tool

Use `quarto-cli` when:
- Your task involves cli tool: quarto-cli
- A task requires quarto-cli-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what quarto-cli provides
