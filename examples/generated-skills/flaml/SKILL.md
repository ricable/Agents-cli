---
name: FLAML
version: 0.0.0
description: "CLI tool: FLAML. Use this skill whenever the user works with FLAML or tasks related to cli tool: flaml — even if they don't mention "FLAML" by name."
ingredients:
  - microsoft/FLAML
tags:
  - cli
---

# FLAML

CLI tool: FLAML

## Overview

FLAML provides cli tool: flaml. Agents benefit from FLAML because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add microsoft/FLAML

# Or clone from GitHub
git clone https://github.com/microsoft/FLAML.git
```

## Usage

```bash
# Show help and available options
FLAML --help

# Check version
FLAML --version
```

Refer to the project documentation for detailed usage:
- https://github.com/microsoft/FLAML

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add microsoft/FLAML

# 2. Verify installation
agents-cli run FLAML -- --version

# 3. Explore capabilities
agents-cli schema FLAML --json
```

### Piping with other tools

```bash
# Chain FLAML output with jq for structured processing
agents-cli run FLAML -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run FLAML -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run FLAML -- --help --json

# Introspect full command schema
agents-cli schema FLAML --json

# Dry-run before executing (safe exploration)
agents-cli run FLAML -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe FLAML --json
```

## When to Use This Tool

Use `FLAML` when:
- Your task involves cli tool: flaml
- A task requires FLAML-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what FLAML provides
