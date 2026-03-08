---
name: segment-anything
version: 0.0.0
description: "CLI tool: segment-anything. Use this skill whenever the user works with segment-anything or tasks related to cli tool: segment-anything — even if they don't mention "segment-anything" by name."
ingredients:
  - facebookresearch/segment-anything
tags:
  - cli
---

# segment-anything

CLI tool: segment-anything

## Overview

segment-anything provides cli tool: segment-anything. Agents benefit from segment-anything because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add facebookresearch/segment-anything

# Or clone from GitHub
git clone https://github.com/facebookresearch/segment-anything.git
```

## Usage

```bash
# Show help and available options
segment-anything --help

# Check version
segment-anything --version
```

Refer to the project documentation for detailed usage:
- https://github.com/facebookresearch/segment-anything

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add facebookresearch/segment-anything

# 2. Verify installation
agents-cli run segment-anything -- --version

# 3. Explore capabilities
agents-cli schema segment-anything --json
```

### Piping with other tools

```bash
# Chain segment-anything output with jq for structured processing
agents-cli run segment-anything -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run segment-anything -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run segment-anything -- --help --json

# Introspect full command schema
agents-cli schema segment-anything --json

# Dry-run before executing (safe exploration)
agents-cli run segment-anything -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe segment-anything --json
```

## When to Use This Tool

Use `segment-anything` when:
- Your task involves cli tool: segment-anything
- A task requires segment-anything-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what segment-anything provides
