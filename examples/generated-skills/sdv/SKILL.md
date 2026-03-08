---
name: SDV
version: 0.0.0
description: "CLI tool: SDV. Use this skill whenever the user works with SDV or tasks related to cli tool: sdv — even if they don't mention "SDV" by name."
ingredients:
  - sdv-dev/SDV
tags:
  - cli
---

# SDV

CLI tool: SDV

## Overview

SDV provides cli tool: sdv. Agents benefit from SDV because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add sdv-dev/SDV

# Or clone from GitHub
git clone https://github.com/sdv-dev/SDV.git
```

## Usage

```bash
# Show help and available options
SDV --help

# Check version
SDV --version
```

Refer to the project documentation for detailed usage:
- https://github.com/sdv-dev/SDV

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add sdv-dev/SDV

# 2. Verify installation
agents-cli run SDV -- --version

# 3. Explore capabilities
agents-cli schema SDV --json
```

### Piping with other tools

```bash
# Chain SDV output with jq for structured processing
agents-cli run SDV -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run SDV -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run SDV -- --help --json

# Introspect full command schema
agents-cli schema SDV --json

# Dry-run before executing (safe exploration)
agents-cli run SDV -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe SDV --json
```

## When to Use This Tool

Use `SDV` when:
- Your task involves cli tool: sdv
- A task requires SDV-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what SDV provides
