---
name: polars
version: 0.0.0
description: "CLI tool: polars. Use this skill whenever the user works with polars or tasks related to cli tool: polars — even if they don't mention "polars" by name."
ingredients:
  - pola-rs/polars
tags:
  - cli
---

# polars

CLI tool: polars

## Overview

polars provides cli tool: polars. Agents benefit from polars because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add pola-rs/polars

# Or clone from GitHub
git clone https://github.com/pola-rs/polars.git
```

## Usage

```bash
# Show help and available options
polars --help

# Check version
polars --version
```

Refer to the project documentation for detailed usage:
- https://github.com/pola-rs/polars

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add pola-rs/polars

# 2. Verify installation
agents-cli run polars -- --version

# 3. Explore capabilities
agents-cli schema polars --json
```

### Piping with other tools

```bash
# Chain polars output with jq for structured processing
agents-cli run polars -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run polars -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run polars -- --help --json

# Introspect full command schema
agents-cli schema polars --json

# Dry-run before executing (safe exploration)
agents-cli run polars -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe polars --json
```

## When to Use This Tool

Use `polars` when:
- Your task involves cli tool: polars
- A task requires polars-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what polars provides
