---
name: cobra
version: 0.0.0
description: "CLI tool: cobra. Use this skill whenever the user works with cobra or tasks related to cli tool: cobra — even if they don't mention "cobra" by name."
ingredients:
  - spf13/cobra
tags:
  - cli
---

# cobra

CLI tool: cobra

## Overview

cobra provides cli tool: cobra. Agents benefit from cobra because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add spf13/cobra

# Or clone from GitHub
git clone https://github.com/spf13/cobra.git
```

## Usage

```bash
# Show help and available options
cobra --help

# Check version
cobra --version
```

Refer to the project documentation for detailed usage:
- https://github.com/spf13/cobra

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add spf13/cobra

# 2. Verify installation
agents-cli run cobra -- --version

# 3. Explore capabilities
agents-cli schema cobra --json
```

### Piping with other tools

```bash
# Chain cobra output with jq for structured processing
agents-cli run cobra -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run cobra -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run cobra -- --help --json

# Introspect full command schema
agents-cli schema cobra --json

# Dry-run before executing (safe exploration)
agents-cli run cobra -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe cobra --json
```

## When to Use This Tool

Use `cobra` when:
- Your task involves cli tool: cobra
- A task requires cobra-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what cobra provides
