---
name: giskard
version: 0.0.0
description: "CLI tool: giskard. Use this skill whenever the user works with giskard or tasks related to cli tool: giskard — even if they don't mention "giskard" by name."
ingredients:
  - Giskard-AI/giskard
tags:
  - cli
---

# giskard

CLI tool: giskard

## Overview

giskard provides cli tool: giskard. Agents benefit from giskard because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add Giskard-AI/giskard

# Or clone from GitHub
git clone https://github.com/Giskard-AI/giskard.git
```

## Usage

```bash
# Show help and available options
giskard --help

# Check version
giskard --version
```

Refer to the project documentation for detailed usage:
- https://github.com/Giskard-AI/giskard

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add Giskard-AI/giskard

# 2. Verify installation
agents-cli run giskard -- --version

# 3. Explore capabilities
agents-cli schema giskard --json
```

### Piping with other tools

```bash
# Chain giskard output with jq for structured processing
agents-cli run giskard -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run giskard -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run giskard -- --help --json

# Introspect full command schema
agents-cli schema giskard --json

# Dry-run before executing (safe exploration)
agents-cli run giskard -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe giskard --json
```

## When to Use This Tool

Use `giskard` when:
- Your task involves cli tool: giskard
- A task requires giskard-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what giskard provides
