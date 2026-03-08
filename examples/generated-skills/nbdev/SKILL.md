---
name: nbdev
version: 0.0.0
description: "CLI tool: nbdev. Use this skill whenever the user works with nbdev or tasks related to cli tool: nbdev — even if they don't mention "nbdev" by name."
ingredients:
  - fastai/nbdev
tags:
  - cli
---

# nbdev

CLI tool: nbdev

## Overview

nbdev provides cli tool: nbdev. Agents benefit from nbdev because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add fastai/nbdev

# Or clone from GitHub
git clone https://github.com/fastai/nbdev.git
```

## Usage

```bash
# Show help and available options
nbdev --help

# Check version
nbdev --version
```

Refer to the project documentation for detailed usage:
- https://github.com/fastai/nbdev

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add fastai/nbdev

# 2. Verify installation
agents-cli run nbdev -- --version

# 3. Explore capabilities
agents-cli schema nbdev --json
```

### Piping with other tools

```bash
# Chain nbdev output with jq for structured processing
agents-cli run nbdev -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run nbdev -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run nbdev -- --help --json

# Introspect full command schema
agents-cli schema nbdev --json

# Dry-run before executing (safe exploration)
agents-cli run nbdev -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe nbdev --json
```

## When to Use This Tool

Use `nbdev` when:
- Your task involves cli tool: nbdev
- A task requires nbdev-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what nbdev provides
