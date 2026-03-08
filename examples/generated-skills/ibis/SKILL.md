---
name: ibis
version: 0.0.0
description: "CLI tool: ibis. Use this skill whenever the user works with ibis or tasks related to cli tool: ibis — even if they don't mention "ibis" by name."
ingredients:
  - ibis-project/ibis
tags:
  - cli
---

# ibis

CLI tool: ibis

## Overview

ibis provides cli tool: ibis. Agents benefit from ibis because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add ibis-project/ibis

# Or clone from GitHub
git clone https://github.com/ibis-project/ibis.git
```

## Usage

```bash
# Show help and available options
ibis --help

# Check version
ibis --version
```

Refer to the project documentation for detailed usage:
- https://github.com/ibis-project/ibis

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add ibis-project/ibis

# 2. Verify installation
agents-cli run ibis -- --version

# 3. Explore capabilities
agents-cli schema ibis --json
```

### Piping with other tools

```bash
# Chain ibis output with jq for structured processing
agents-cli run ibis -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run ibis -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run ibis -- --help --json

# Introspect full command schema
agents-cli schema ibis --json

# Dry-run before executing (safe exploration)
agents-cli run ibis -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe ibis --json
```

## When to Use This Tool

Use `ibis` when:
- Your task involves cli tool: ibis
- A task requires ibis-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what ibis provides
