---
name: guildai
version: 0.0.0
description: "CLI tool: guildai. Use this skill whenever the user works with guildai or tasks related to cli tool: guildai — even if they don't mention "guildai" by name."
ingredients:
  - guildai/guildai
tags:
  - cli
---

# guildai

CLI tool: guildai

## Overview

guildai provides cli tool: guildai. Agents benefit from guildai because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add guildai/guildai

# Or clone from GitHub
git clone https://github.com/guildai/guildai.git
```

## Usage

```bash
# Show help and available options
guildai --help

# Check version
guildai --version
```

Refer to the project documentation for detailed usage:
- https://github.com/guildai/guildai

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add guildai/guildai

# 2. Verify installation
agents-cli run guildai -- --version

# 3. Explore capabilities
agents-cli schema guildai --json
```

### Piping with other tools

```bash
# Chain guildai output with jq for structured processing
agents-cli run guildai -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run guildai -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run guildai -- --help --json

# Introspect full command schema
agents-cli schema guildai --json

# Dry-run before executing (safe exploration)
agents-cli run guildai -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe guildai --json
```

## When to Use This Tool

Use `guildai` when:
- Your task involves cli tool: guildai
- A task requires guildai-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what guildai provides
