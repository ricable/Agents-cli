---
name: nougat
version: 0.0.0
description: "CLI tool: nougat. Use this skill whenever the user works with nougat or tasks related to cli tool: nougat — even if they don't mention "nougat" by name."
ingredients:
  - facebookresearch/nougat
tags:
  - cli
---

# nougat

CLI tool: nougat

## Overview

nougat provides cli tool: nougat. Agents benefit from nougat because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add facebookresearch/nougat

# Or clone from GitHub
git clone https://github.com/facebookresearch/nougat.git
```

## Usage

```bash
# Show help and available options
nougat --help

# Check version
nougat --version
```

Refer to the project documentation for detailed usage:
- https://github.com/facebookresearch/nougat

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add facebookresearch/nougat

# 2. Verify installation
agents-cli run nougat -- --version

# 3. Explore capabilities
agents-cli schema nougat --json
```

### Piping with other tools

```bash
# Chain nougat output with jq for structured processing
agents-cli run nougat -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run nougat -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run nougat -- --help --json

# Introspect full command schema
agents-cli schema nougat --json

# Dry-run before executing (safe exploration)
agents-cli run nougat -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe nougat --json
```

## When to Use This Tool

Use `nougat` when:
- Your task involves cli tool: nougat
- A task requires nougat-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what nougat provides
