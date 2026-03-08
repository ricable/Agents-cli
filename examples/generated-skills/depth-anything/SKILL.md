---
name: Depth-Anything
version: 0.0.0
description: "CLI tool: Depth-Anything. Use this skill whenever the user works with Depth-Anything or tasks related to cli tool: depth-anything — even if they don't mention "Depth-Anything" by name."
ingredients:
  - LiheYoung/Depth-Anything
tags:
  - cli
---

# Depth-Anything

CLI tool: Depth-Anything

## Overview

Depth-Anything provides cli tool: depth-anything. Agents benefit from Depth-Anything because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add LiheYoung/Depth-Anything

# Or clone from GitHub
git clone https://github.com/LiheYoung/Depth-Anything.git
```

## Usage

```bash
# Show help and available options
Depth-Anything --help

# Check version
Depth-Anything --version
```

Refer to the project documentation for detailed usage:
- https://github.com/LiheYoung/Depth-Anything

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add LiheYoung/Depth-Anything

# 2. Verify installation
agents-cli run Depth-Anything -- --version

# 3. Explore capabilities
agents-cli schema Depth-Anything --json
```

### Piping with other tools

```bash
# Chain Depth-Anything output with jq for structured processing
agents-cli run Depth-Anything -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run Depth-Anything -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run Depth-Anything -- --help --json

# Introspect full command schema
agents-cli schema Depth-Anything --json

# Dry-run before executing (safe exploration)
agents-cli run Depth-Anything -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe Depth-Anything --json
```

## When to Use This Tool

Use `Depth-Anything` when:
- Your task involves cli tool: depth-anything
- A task requires Depth-Anything-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what Depth-Anything provides
