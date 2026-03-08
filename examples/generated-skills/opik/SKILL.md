---
name: opik
version: 0.0.0
description: "CLI tool: opik. Use this skill whenever the user works with opik or tasks related to cli tool: opik — even if they don't mention "opik" by name."
ingredients:
  - comet-ml/opik
tags:
  - cli
---

# opik

CLI tool: opik

## Overview

opik provides cli tool: opik. Agents benefit from opik because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add comet-ml/opik

# Or clone from GitHub
git clone https://github.com/comet-ml/opik.git
```

## Usage

```bash
# Show help and available options
opik --help

# Check version
opik --version
```

Refer to the project documentation for detailed usage:
- https://github.com/comet-ml/opik

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add comet-ml/opik

# 2. Verify installation
agents-cli run opik -- --version

# 3. Explore capabilities
agents-cli schema opik --json
```

### Piping with other tools

```bash
# Chain opik output with jq for structured processing
agents-cli run opik -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run opik -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run opik -- --help --json

# Introspect full command schema
agents-cli schema opik --json

# Dry-run before executing (safe exploration)
agents-cli run opik -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe opik --json
```

## When to Use This Tool

Use `opik` when:
- Your task involves cli tool: opik
- A task requires opik-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what opik provides
