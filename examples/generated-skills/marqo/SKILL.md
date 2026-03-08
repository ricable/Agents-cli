---
name: marqo
version: 0.0.0
description: "CLI tool: marqo. Use this skill whenever the user works with marqo or tasks related to cli tool: marqo — even if they don't mention "marqo" by name."
ingredients:
  - marqo-ai/marqo
tags:
  - cli
---

# marqo

CLI tool: marqo

## Overview

marqo provides cli tool: marqo. Agents benefit from marqo because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add marqo-ai/marqo

# Or clone from GitHub
git clone https://github.com/marqo-ai/marqo.git
```

## Usage

```bash
# Show help and available options
marqo --help

# Check version
marqo --version
```

Refer to the project documentation for detailed usage:
- https://github.com/marqo-ai/marqo

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add marqo-ai/marqo

# 2. Verify installation
agents-cli run marqo -- --version

# 3. Explore capabilities
agents-cli schema marqo --json
```

### Piping with other tools

```bash
# Chain marqo output with jq for structured processing
agents-cli run marqo -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run marqo -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run marqo -- --help --json

# Introspect full command schema
agents-cli schema marqo --json

# Dry-run before executing (safe exploration)
agents-cli run marqo -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe marqo --json
```

## When to Use This Tool

Use `marqo` when:
- Your task involves cli tool: marqo
- A task requires marqo-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what marqo provides
