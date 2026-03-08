---
name: wandb
version: 0.0.0
description: "CLI tool: wandb. Use this skill whenever the user works with wandb or tasks related to cli tool: wandb — even if they don't mention "wandb" by name."
ingredients:
  - wandb/wandb
tags:
  - cli
---

# wandb

CLI tool: wandb

## Overview

wandb provides cli tool: wandb. Agents benefit from wandb because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add wandb/wandb

# Or clone from GitHub
git clone https://github.com/wandb/wandb.git
```

## Usage

```bash
# Show help and available options
wandb --help

# Check version
wandb --version
```

Refer to the project documentation for detailed usage:
- https://github.com/wandb/wandb

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add wandb/wandb

# 2. Verify installation
agents-cli run wandb -- --version

# 3. Explore capabilities
agents-cli schema wandb --json
```

### Piping with other tools

```bash
# Chain wandb output with jq for structured processing
agents-cli run wandb -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run wandb -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run wandb -- --help --json

# Introspect full command schema
agents-cli schema wandb --json

# Dry-run before executing (safe exploration)
agents-cli run wandb -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe wandb --json
```

## When to Use This Tool

Use `wandb` when:
- Your task involves cli tool: wandb
- A task requires wandb-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what wandb provides
