---
name: nomic
version: 0.0.0
description: "CLI tool: nomic. Use this skill whenever the user works with nomic or tasks related to cli tool: nomic — even if they don't mention "nomic" by name."
ingredients:
  - nomic-ai/nomic
tags:
  - cli
---

# nomic

CLI tool: nomic

## Overview

nomic provides cli tool: nomic. Agents benefit from nomic because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add nomic-ai/nomic

# Or clone from GitHub
git clone https://github.com/nomic-ai/nomic.git
```

## Usage

```bash
# Show help and available options
nomic --help

# Check version
nomic --version
```

Refer to the project documentation for detailed usage:
- https://github.com/nomic-ai/nomic

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add nomic-ai/nomic

# 2. Verify installation
agents-cli run nomic -- --version

# 3. Explore capabilities
agents-cli schema nomic --json
```

### Piping with other tools

```bash
# Chain nomic output with jq for structured processing
agents-cli run nomic -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run nomic -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run nomic -- --help --json

# Introspect full command schema
agents-cli schema nomic --json

# Dry-run before executing (safe exploration)
agents-cli run nomic -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe nomic --json
```

## When to Use This Tool

Use `nomic` when:
- Your task involves cli tool: nomic
- A task requires nomic-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what nomic provides
