---
name: argilla
version: 0.0.0
description: "CLI tool: argilla. Use this skill whenever the user works with argilla or tasks related to cli tool: argilla — even if they don't mention "argilla" by name."
ingredients:
  - argilla-io/argilla
tags:
  - cli
---

# argilla

CLI tool: argilla

## Overview

argilla provides cli tool: argilla. Agents benefit from argilla because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add argilla-io/argilla

# Or clone from GitHub
git clone https://github.com/argilla-io/argilla.git
```

## Usage

```bash
# Show help and available options
argilla --help

# Check version
argilla --version
```

Refer to the project documentation for detailed usage:
- https://github.com/argilla-io/argilla

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add argilla-io/argilla

# 2. Verify installation
agents-cli run argilla -- --version

# 3. Explore capabilities
agents-cli schema argilla --json
```

### Piping with other tools

```bash
# Chain argilla output with jq for structured processing
agents-cli run argilla -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run argilla -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run argilla -- --help --json

# Introspect full command schema
agents-cli schema argilla --json

# Dry-run before executing (safe exploration)
agents-cli run argilla -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe argilla --json
```

## When to Use This Tool

Use `argilla` when:
- Your task involves cli tool: argilla
- A task requires argilla-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what argilla provides
