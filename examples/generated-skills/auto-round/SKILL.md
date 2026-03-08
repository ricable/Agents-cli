---
name: auto-round
version: 0.0.0
description: "CLI tool: auto-round. Use this skill whenever the user works with auto-round or tasks related to cli tool: auto-round — even if they don't mention "auto-round" by name."
ingredients:
  - intel/auto-round
tags:
  - cli
---

# auto-round

CLI tool: auto-round

## Overview

auto-round provides cli tool: auto-round. Agents benefit from auto-round because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add intel/auto-round

# Or clone from GitHub
git clone https://github.com/intel/auto-round.git
```

## Usage

```bash
# Show help and available options
auto-round --help

# Check version
auto-round --version
```

Refer to the project documentation for detailed usage:
- https://github.com/intel/auto-round

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add intel/auto-round

# 2. Verify installation
agents-cli run auto-round -- --version

# 3. Explore capabilities
agents-cli schema auto-round --json
```

### Piping with other tools

```bash
# Chain auto-round output with jq for structured processing
agents-cli run auto-round -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run auto-round -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run auto-round -- --help --json

# Introspect full command schema
agents-cli schema auto-round --json

# Dry-run before executing (safe exploration)
agents-cli run auto-round -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe auto-round --json
```

## When to Use This Tool

Use `auto-round` when:
- Your task involves cli tool: auto-round
- A task requires auto-round-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what auto-round provides
