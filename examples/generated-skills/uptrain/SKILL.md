---
name: uptrain
version: 0.0.0
description: "CLI tool: uptrain. Use this skill whenever the user works with uptrain or tasks related to cli tool: uptrain — even if they don't mention "uptrain" by name."
ingredients:
  - uptrain-ai/uptrain
tags:
  - cli
---

# uptrain

CLI tool: uptrain

## Overview

uptrain provides cli tool: uptrain. Agents benefit from uptrain because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add uptrain-ai/uptrain

# Or clone from GitHub
git clone https://github.com/uptrain-ai/uptrain.git
```

## Usage

```bash
# Show help and available options
uptrain --help

# Check version
uptrain --version
```

Refer to the project documentation for detailed usage:
- https://github.com/uptrain-ai/uptrain

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add uptrain-ai/uptrain

# 2. Verify installation
agents-cli run uptrain -- --version

# 3. Explore capabilities
agents-cli schema uptrain --json
```

### Piping with other tools

```bash
# Chain uptrain output with jq for structured processing
agents-cli run uptrain -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run uptrain -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run uptrain -- --help --json

# Introspect full command schema
agents-cli schema uptrain --json

# Dry-run before executing (safe exploration)
agents-cli run uptrain -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe uptrain --json
```

## When to Use This Tool

Use `uptrain` when:
- Your task involves cli tool: uptrain
- A task requires uptrain-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what uptrain provides
