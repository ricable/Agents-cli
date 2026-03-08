---
name: lancedb
version: 0.0.0
description: "CLI tool: lancedb. Use this skill whenever the user works with lancedb or tasks related to cli tool: lancedb — even if they don't mention "lancedb" by name."
ingredients:
  - lancedb/lancedb
tags:
  - cli
---

# lancedb

CLI tool: lancedb

## Overview

lancedb provides cli tool: lancedb. Agents benefit from lancedb because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add lancedb/lancedb

# Or clone from GitHub
git clone https://github.com/lancedb/lancedb.git
```

## Usage

```bash
# Show help and available options
lancedb --help

# Check version
lancedb --version
```

Refer to the project documentation for detailed usage:
- https://github.com/lancedb/lancedb

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add lancedb/lancedb

# 2. Verify installation
agents-cli run lancedb -- --version

# 3. Explore capabilities
agents-cli schema lancedb --json
```

### Piping with other tools

```bash
# Chain lancedb output with jq for structured processing
agents-cli run lancedb -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run lancedb -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run lancedb -- --help --json

# Introspect full command schema
agents-cli schema lancedb --json

# Dry-run before executing (safe exploration)
agents-cli run lancedb -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe lancedb --json
```

## When to Use This Tool

Use `lancedb` when:
- Your task involves cli tool: lancedb
- A task requires lancedb-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what lancedb provides
