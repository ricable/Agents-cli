---
name: torchtune
version: 0.0.0
description: "CLI tool: torchtune. Use this skill whenever the user works with torchtune or tasks related to cli tool: torchtune — even if they don't mention "torchtune" by name."
ingredients:
  - pytorch/torchtune
tags:
  - cli
---

# torchtune

CLI tool: torchtune

## Overview

torchtune provides cli tool: torchtune. Agents benefit from torchtune because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add pytorch/torchtune

# Or clone from GitHub
git clone https://github.com/pytorch/torchtune.git
```

## Usage

```bash
# Show help and available options
torchtune --help

# Check version
torchtune --version
```

Refer to the project documentation for detailed usage:
- https://github.com/pytorch/torchtune

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add pytorch/torchtune

# 2. Verify installation
agents-cli run torchtune -- --version

# 3. Explore capabilities
agents-cli schema torchtune --json
```

### Piping with other tools

```bash
# Chain torchtune output with jq for structured processing
agents-cli run torchtune -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run torchtune -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run torchtune -- --help --json

# Introspect full command schema
agents-cli schema torchtune --json

# Dry-run before executing (safe exploration)
agents-cli run torchtune -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe torchtune --json
```

## When to Use This Tool

Use `torchtune` when:
- Your task involves cli tool: torchtune
- A task requires torchtune-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what torchtune provides
