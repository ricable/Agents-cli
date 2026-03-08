---
name: qdrant
version: 0.0.0
description: "CLI tool: qdrant. Use this skill whenever the user works with qdrant or tasks related to cli tool: qdrant — even if they don't mention "qdrant" by name."
ingredients:
  - qdrant/qdrant
tags:
  - cli
---

# qdrant

CLI tool: qdrant

## Overview

qdrant provides cli tool: qdrant. Agents benefit from qdrant because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add qdrant/qdrant

# Or clone from GitHub
git clone https://github.com/qdrant/qdrant.git
```

## Usage

```bash
# Show help and available options
qdrant --help

# Check version
qdrant --version
```

Refer to the project documentation for detailed usage:
- https://github.com/qdrant/qdrant

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add qdrant/qdrant

# 2. Verify installation
agents-cli run qdrant -- --version

# 3. Explore capabilities
agents-cli schema qdrant --json
```

### Piping with other tools

```bash
# Chain qdrant output with jq for structured processing
agents-cli run qdrant -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run qdrant -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run qdrant -- --help --json

# Introspect full command schema
agents-cli schema qdrant --json

# Dry-run before executing (safe exploration)
agents-cli run qdrant -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe qdrant --json
```

## When to Use This Tool

Use `qdrant` when:
- Your task involves cli tool: qdrant
- A task requires qdrant-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what qdrant provides
