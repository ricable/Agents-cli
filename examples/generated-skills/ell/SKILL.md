---
name: ell
version: 0.0.0
description: "CLI tool: ell. Use this skill whenever the user works with ell or tasks related to cli tool: ell — even if they don't mention "ell" by name."
ingredients:
  - MadcowD/ell
tags:
  - cli
---

# ell

CLI tool: ell

## Overview

ell provides cli tool: ell. Agents benefit from ell because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add MadcowD/ell

# Or clone from GitHub
git clone https://github.com/MadcowD/ell.git
```

## Usage

```bash
# Show help and available options
ell --help

# Check version
ell --version
```

Refer to the project documentation for detailed usage:
- https://github.com/MadcowD/ell

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add MadcowD/ell

# 2. Verify installation
agents-cli run ell -- --version

# 3. Explore capabilities
agents-cli schema ell --json
```

### Piping with other tools

```bash
# Chain ell output with jq for structured processing
agents-cli run ell -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run ell -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run ell -- --help --json

# Introspect full command schema
agents-cli schema ell --json

# Dry-run before executing (safe exploration)
agents-cli run ell -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe ell --json
```

## When to Use This Tool

Use `ell` when:
- Your task involves cli tool: ell
- A task requires ell-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what ell provides
