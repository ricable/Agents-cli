---
name: counterfit
version: 0.0.0
description: "CLI tool: counterfit. Use this skill whenever the user works with counterfit or tasks related to cli tool: counterfit — even if they don't mention "counterfit" by name."
ingredients:
  - Azure/counterfit
tags:
  - cli
---

# counterfit

CLI tool: counterfit

## Overview

counterfit provides cli tool: counterfit. Agents benefit from counterfit because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add Azure/counterfit

# Or clone from GitHub
git clone https://github.com/Azure/counterfit.git
```

## Usage

```bash
# Show help and available options
counterfit --help

# Check version
counterfit --version
```

Refer to the project documentation for detailed usage:
- https://github.com/Azure/counterfit

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add Azure/counterfit

# 2. Verify installation
agents-cli run counterfit -- --version

# 3. Explore capabilities
agents-cli schema counterfit --json
```

### Piping with other tools

```bash
# Chain counterfit output with jq for structured processing
agents-cli run counterfit -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run counterfit -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run counterfit -- --help --json

# Introspect full command schema
agents-cli schema counterfit --json

# Dry-run before executing (safe exploration)
agents-cli run counterfit -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe counterfit --json
```

## When to Use This Tool

Use `counterfit` when:
- Your task involves cli tool: counterfit
- A task requires counterfit-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what counterfit provides
