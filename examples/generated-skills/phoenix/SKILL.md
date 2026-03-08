---
name: phoenix
version: 0.0.0
description: "CLI tool: phoenix. Use this skill whenever the user works with phoenix or tasks related to cli tool: phoenix — even if they don't mention "phoenix" by name."
ingredients:
  - Arize-ai/phoenix
tags:
  - cli
---

# phoenix

CLI tool: phoenix

## Overview

phoenix provides cli tool: phoenix. Agents benefit from phoenix because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add Arize-ai/phoenix

# Or clone from GitHub
git clone https://github.com/Arize-ai/phoenix.git
```

## Usage

```bash
# Show help and available options
phoenix --help

# Check version
phoenix --version
```

Refer to the project documentation for detailed usage:
- https://github.com/Arize-ai/phoenix

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add Arize-ai/phoenix

# 2. Verify installation
agents-cli run phoenix -- --version

# 3. Explore capabilities
agents-cli schema phoenix --json
```

### Piping with other tools

```bash
# Chain phoenix output with jq for structured processing
agents-cli run phoenix -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run phoenix -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run phoenix -- --help --json

# Introspect full command schema
agents-cli schema phoenix --json

# Dry-run before executing (safe exploration)
agents-cli run phoenix -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe phoenix --json
```

## When to Use This Tool

Use `phoenix` when:
- Your task involves cli tool: phoenix
- A task requires phoenix-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what phoenix provides
