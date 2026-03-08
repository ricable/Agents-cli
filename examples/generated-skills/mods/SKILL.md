---
name: mods
version: 0.0.0
description: "AI on the command line. Use this skill whenever the user works with mods or tasks related to ai on the command line — even if they don't mention "mods" by name."
ingredients:
  - charmbracelet/mods
tags:
  - cli
# homepage: https://github.com/charmbracelet/mods
# license: MIT
---

# mods

AI on the command line

**Source**: https://github.com/charmbracelet/mods

## Overview

mods provides ai on the command line. Agents benefit from mods because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add charmbracelet/mods

# Or clone from GitHub
git clone https://github.com/charmbracelet/mods.git
```

## Usage

```bash
# Show help and available options
mods --help

# Check version
mods --version
```

Refer to the project documentation for detailed usage:
- https://github.com/charmbracelet/mods

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add charmbracelet/mods

# 2. Verify installation
agents-cli run mods -- --version

# 3. Explore capabilities
agents-cli schema mods --json
```

### Piping with other tools

```bash
# Chain mods output with jq for structured processing
agents-cli run mods -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run mods -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run mods -- --help --json

# Introspect full command schema
agents-cli schema mods --json

# Dry-run before executing (safe exploration)
agents-cli run mods -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe mods --json
```

## When to Use This Tool

Use `mods` when:
- Your task involves ai on the command line
- A task requires mods-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what mods provides
