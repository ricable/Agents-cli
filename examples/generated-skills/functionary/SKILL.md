---
name: functionary
version: 0.0.0
description: "CLI tool: functionary. Use this skill whenever the user works with functionary or tasks related to cli tool: functionary — even if they don't mention "functionary" by name."
ingredients:
  - MeetKai/functionary
tags:
  - cli
---

# functionary

CLI tool: functionary

## Overview

functionary provides cli tool: functionary. Agents benefit from functionary because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add MeetKai/functionary

# Or clone from GitHub
git clone https://github.com/MeetKai/functionary.git
```

## Usage

```bash
# Show help and available options
functionary --help

# Check version
functionary --version
```

Refer to the project documentation for detailed usage:
- https://github.com/MeetKai/functionary

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add MeetKai/functionary

# 2. Verify installation
agents-cli run functionary -- --version

# 3. Explore capabilities
agents-cli schema functionary --json
```

### Piping with other tools

```bash
# Chain functionary output with jq for structured processing
agents-cli run functionary -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run functionary -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run functionary -- --help --json

# Introspect full command schema
agents-cli schema functionary --json

# Dry-run before executing (safe exploration)
agents-cli run functionary -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe functionary --json
```

## When to Use This Tool

Use `functionary` when:
- Your task involves cli tool: functionary
- A task requires functionary-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what functionary provides
