---
name: kornia
version: 0.0.0
description: "CLI tool: kornia. Use this skill whenever the user works with kornia or tasks related to cli tool: kornia — even if they don't mention "kornia" by name."
ingredients:
  - kornia/kornia
tags:
  - cli
---

# kornia

CLI tool: kornia

## Overview

kornia provides cli tool: kornia. Agents benefit from kornia because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add kornia/kornia

# Or clone from GitHub
git clone https://github.com/kornia/kornia.git
```

## Usage

```bash
# Show help and available options
kornia --help

# Check version
kornia --version
```

Refer to the project documentation for detailed usage:
- https://github.com/kornia/kornia

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add kornia/kornia

# 2. Verify installation
agents-cli run kornia -- --version

# 3. Explore capabilities
agents-cli schema kornia --json
```

### Piping with other tools

```bash
# Chain kornia output with jq for structured processing
agents-cli run kornia -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run kornia -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run kornia -- --help --json

# Introspect full command schema
agents-cli schema kornia --json

# Dry-run before executing (safe exploration)
agents-cli run kornia -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe kornia --json
```

## When to Use This Tool

Use `kornia` when:
- Your task involves cli tool: kornia
- A task requires kornia-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what kornia provides
