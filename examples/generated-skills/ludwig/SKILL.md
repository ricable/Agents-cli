---
name: ludwig
version: 0.0.0
description: "CLI tool: ludwig. Use this skill whenever the user works with ludwig or tasks related to cli tool: ludwig — even if they don't mention "ludwig" by name."
ingredients:
  - ludwig-ai/ludwig
tags:
  - cli
---

# ludwig

CLI tool: ludwig

## Overview

ludwig provides cli tool: ludwig. Agents benefit from ludwig because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add ludwig-ai/ludwig

# Or clone from GitHub
git clone https://github.com/ludwig-ai/ludwig.git
```

## Usage

```bash
# Show help and available options
ludwig --help

# Check version
ludwig --version
```

Refer to the project documentation for detailed usage:
- https://github.com/ludwig-ai/ludwig

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add ludwig-ai/ludwig

# 2. Verify installation
agents-cli run ludwig -- --version

# 3. Explore capabilities
agents-cli schema ludwig --json
```

### Piping with other tools

```bash
# Chain ludwig output with jq for structured processing
agents-cli run ludwig -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run ludwig -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run ludwig -- --help --json

# Introspect full command schema
agents-cli schema ludwig --json

# Dry-run before executing (safe exploration)
agents-cli run ludwig -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe ludwig --json
```

## When to Use This Tool

Use `ludwig` when:
- Your task involves cli tool: ludwig
- A task requires ludwig-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what ludwig provides
