---
name: soda-core
version: 0.0.0
description: "CLI tool: soda-core. Use this skill whenever the user works with soda-core or tasks related to cli tool: soda-core — even if they don't mention "soda-core" by name."
ingredients:
  - sodadata/soda-core
tags:
  - cli
---

# soda-core

CLI tool: soda-core

## Overview

soda-core provides cli tool: soda-core. Agents benefit from soda-core because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add sodadata/soda-core

# Or clone from GitHub
git clone https://github.com/sodadata/soda-core.git
```

## Usage

```bash
# Show help and available options
soda-core --help

# Check version
soda-core --version
```

Refer to the project documentation for detailed usage:
- https://github.com/sodadata/soda-core

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add sodadata/soda-core

# 2. Verify installation
agents-cli run soda-core -- --version

# 3. Explore capabilities
agents-cli schema soda-core --json
```

### Piping with other tools

```bash
# Chain soda-core output with jq for structured processing
agents-cli run soda-core -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run soda-core -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run soda-core -- --help --json

# Introspect full command schema
agents-cli schema soda-core --json

# Dry-run before executing (safe exploration)
agents-cli run soda-core -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe soda-core --json
```

## When to Use This Tool

Use `soda-core` when:
- Your task involves cli tool: soda-core
- A task requires soda-core-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what soda-core provides
