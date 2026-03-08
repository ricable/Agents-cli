---
name: reader
version: 0.0.0
description: "CLI tool: reader. Use this skill whenever the user works with reader or tasks related to cli tool: reader — even if they don't mention "reader" by name."
ingredients:
  - jina-ai/reader
tags:
  - cli
---

# reader

CLI tool: reader

## Overview

reader provides cli tool: reader. Agents benefit from reader because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add jina-ai/reader

# Or clone from GitHub
git clone https://github.com/jina-ai/reader.git
```

## Usage

```bash
# Show help and available options
reader --help

# Check version
reader --version
```

Refer to the project documentation for detailed usage:
- https://github.com/jina-ai/reader

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add jina-ai/reader

# 2. Verify installation
agents-cli run reader -- --version

# 3. Explore capabilities
agents-cli schema reader --json
```

### Piping with other tools

```bash
# Chain reader output with jq for structured processing
agents-cli run reader -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run reader -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run reader -- --help --json

# Introspect full command schema
agents-cli schema reader --json

# Dry-run before executing (safe exploration)
agents-cli run reader -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe reader --json
```

## When to Use This Tool

Use `reader` when:
- Your task involves cli tool: reader
- A task requires reader-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what reader provides
