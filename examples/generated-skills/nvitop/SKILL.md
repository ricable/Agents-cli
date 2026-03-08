---
name: nvitop
version: 0.0.0
description: "CLI tool: nvitop. Use this skill whenever the user works with nvitop or tasks related to cli tool: nvitop — even if they don't mention "nvitop" by name."
ingredients:
  - XuehaiPan/nvitop
tags:
  - cli
---

# nvitop

CLI tool: nvitop

## Overview

nvitop provides cli tool: nvitop. Agents benefit from nvitop because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add XuehaiPan/nvitop

# Or clone from GitHub
git clone https://github.com/XuehaiPan/nvitop.git
```

## Usage

```bash
# Show help and available options
nvitop --help

# Check version
nvitop --version
```

Refer to the project documentation for detailed usage:
- https://github.com/XuehaiPan/nvitop

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add XuehaiPan/nvitop

# 2. Verify installation
agents-cli run nvitop -- --version

# 3. Explore capabilities
agents-cli schema nvitop --json
```

### Piping with other tools

```bash
# Chain nvitop output with jq for structured processing
agents-cli run nvitop -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run nvitop -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run nvitop -- --help --json

# Introspect full command schema
agents-cli schema nvitop --json

# Dry-run before executing (safe exploration)
agents-cli run nvitop -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe nvitop --json
```

## When to Use This Tool

Use `nvitop` when:
- Your task involves cli tool: nvitop
- A task requires nvitop-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what nvitop provides
