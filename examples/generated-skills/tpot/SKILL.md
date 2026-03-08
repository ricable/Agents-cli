---
name: tpot
version: 0.0.0
description: "CLI tool: tpot. Use this skill whenever the user works with tpot or tasks related to cli tool: tpot — even if they don't mention "tpot" by name."
ingredients:
  - EpistasisLab/tpot
tags:
  - cli
---

# tpot

CLI tool: tpot

## Overview

tpot provides cli tool: tpot. Agents benefit from tpot because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add EpistasisLab/tpot

# Or clone from GitHub
git clone https://github.com/EpistasisLab/tpot.git
```

## Usage

```bash
# Show help and available options
tpot --help

# Check version
tpot --version
```

Refer to the project documentation for detailed usage:
- https://github.com/EpistasisLab/tpot

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add EpistasisLab/tpot

# 2. Verify installation
agents-cli run tpot -- --version

# 3. Explore capabilities
agents-cli schema tpot --json
```

### Piping with other tools

```bash
# Chain tpot output with jq for structured processing
agents-cli run tpot -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run tpot -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run tpot -- --help --json

# Introspect full command schema
agents-cli schema tpot --json

# Dry-run before executing (safe exploration)
agents-cli run tpot -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe tpot --json
```

## When to Use This Tool

Use `tpot` when:
- Your task involves cli tool: tpot
- A task requires tpot-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what tpot provides
