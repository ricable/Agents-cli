---
name: sqlcoder
version: 0.0.0
description: "CLI tool: sqlcoder. Use this skill whenever the user works with sqlcoder or tasks related to cli tool: sqlcoder — even if they don't mention "sqlcoder" by name."
ingredients:
  - defog-ai/sqlcoder
tags:
  - cli
---

# sqlcoder

CLI tool: sqlcoder

## Overview

sqlcoder provides cli tool: sqlcoder. Agents benefit from sqlcoder because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add defog-ai/sqlcoder

# Or clone from GitHub
git clone https://github.com/defog-ai/sqlcoder.git
```

## Usage

```bash
# Show help and available options
sqlcoder --help

# Check version
sqlcoder --version
```

Refer to the project documentation for detailed usage:
- https://github.com/defog-ai/sqlcoder

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add defog-ai/sqlcoder

# 2. Verify installation
agents-cli run sqlcoder -- --version

# 3. Explore capabilities
agents-cli schema sqlcoder --json
```

### Piping with other tools

```bash
# Chain sqlcoder output with jq for structured processing
agents-cli run sqlcoder -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run sqlcoder -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run sqlcoder -- --help --json

# Introspect full command schema
agents-cli schema sqlcoder --json

# Dry-run before executing (safe exploration)
agents-cli run sqlcoder -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe sqlcoder --json
```

## When to Use This Tool

Use `sqlcoder` when:
- Your task involves cli tool: sqlcoder
- A task requires sqlcoder-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what sqlcoder provides
