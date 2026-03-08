---
name: jsonformer
version: 0.0.0
description: "CLI tool: jsonformer. Use this skill whenever the user works with jsonformer or tasks related to cli tool: jsonformer — even if they don't mention "jsonformer" by name."
ingredients:
  - 1rgs/jsonformer
tags:
  - cli
---

# jsonformer

CLI tool: jsonformer

## Overview

jsonformer provides cli tool: jsonformer. Agents benefit from jsonformer because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add 1rgs/jsonformer

# Or clone from GitHub
git clone https://github.com/1rgs/jsonformer.git
```

## Usage

```bash
# Show help and available options
jsonformer --help

# Check version
jsonformer --version
```

Refer to the project documentation for detailed usage:
- https://github.com/1rgs/jsonformer

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add 1rgs/jsonformer

# 2. Verify installation
agents-cli run jsonformer -- --version

# 3. Explore capabilities
agents-cli schema jsonformer --json
```

### Piping with other tools

```bash
# Chain jsonformer output with jq for structured processing
agents-cli run jsonformer -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run jsonformer -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run jsonformer -- --help --json

# Introspect full command schema
agents-cli schema jsonformer --json

# Dry-run before executing (safe exploration)
agents-cli run jsonformer -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe jsonformer --json
```

## When to Use This Tool

Use `jsonformer` when:
- Your task involves cli tool: jsonformer
- A task requires jsonformer-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what jsonformer provides
