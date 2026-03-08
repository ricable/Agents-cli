---
name: modin
version: 0.0.0
description: "CLI tool: modin. Use this skill whenever the user works with modin or tasks related to cli tool: modin — even if they don't mention "modin" by name."
ingredients:
  - modin-project/modin
tags:
  - cli
---

# modin

CLI tool: modin

## Overview

modin provides cli tool: modin. Agents benefit from modin because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add modin-project/modin

# Or clone from GitHub
git clone https://github.com/modin-project/modin.git
```

## Usage

```bash
# Show help and available options
modin --help

# Check version
modin --version
```

Refer to the project documentation for detailed usage:
- https://github.com/modin-project/modin

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add modin-project/modin

# 2. Verify installation
agents-cli run modin -- --version

# 3. Explore capabilities
agents-cli schema modin --json
```

### Piping with other tools

```bash
# Chain modin output with jq for structured processing
agents-cli run modin -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run modin -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run modin -- --help --json

# Introspect full command schema
agents-cli schema modin --json

# Dry-run before executing (safe exploration)
agents-cli run modin -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe modin --json
```

## When to Use This Tool

Use `modin` when:
- Your task involves cli tool: modin
- A task requires modin-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what modin provides
