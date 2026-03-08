---
name: aim
version: 0.0.0
description: "CLI tool: aim. Use this skill whenever the user works with aim or tasks related to cli tool: aim — even if they don't mention "aim" by name."
ingredients:
  - aimhubio/aim
tags:
  - cli
---

# aim

CLI tool: aim

## Overview

aim provides cli tool: aim. Agents benefit from aim because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add aimhubio/aim

# Or clone from GitHub
git clone https://github.com/aimhubio/aim.git
```

## Usage

```bash
# Show help and available options
aim --help

# Check version
aim --version
```

Refer to the project documentation for detailed usage:
- https://github.com/aimhubio/aim

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add aimhubio/aim

# 2. Verify installation
agents-cli run aim -- --version

# 3. Explore capabilities
agents-cli schema aim --json
```

### Piping with other tools

```bash
# Chain aim output with jq for structured processing
agents-cli run aim -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run aim -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run aim -- --help --json

# Introspect full command schema
agents-cli schema aim --json

# Dry-run before executing (safe exploration)
agents-cli run aim -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe aim --json
```

## When to Use This Tool

Use `aim` when:
- Your task involves cli tool: aim
- A task requires aim-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what aim provides
