---
name: typesense
version: 0.0.0
description: "CLI tool: typesense. Use this skill whenever the user works with typesense or tasks related to cli tool: typesense — even if they don't mention "typesense" by name."
ingredients:
  - typesense/typesense
tags:
  - cli
---

# typesense

CLI tool: typesense

## Overview

typesense provides cli tool: typesense. Agents benefit from typesense because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add typesense/typesense

# Or clone from GitHub
git clone https://github.com/typesense/typesense.git
```

## Usage

```bash
# Show help and available options
typesense --help

# Check version
typesense --version
```

Refer to the project documentation for detailed usage:
- https://github.com/typesense/typesense

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add typesense/typesense

# 2. Verify installation
agents-cli run typesense -- --version

# 3. Explore capabilities
agents-cli schema typesense --json
```

### Piping with other tools

```bash
# Chain typesense output with jq for structured processing
agents-cli run typesense -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run typesense -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run typesense -- --help --json

# Introspect full command schema
agents-cli schema typesense --json

# Dry-run before executing (safe exploration)
agents-cli run typesense -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe typesense --json
```

## When to Use This Tool

Use `typesense` when:
- Your task involves cli tool: typesense
- A task requires typesense-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what typesense provides
