---
name: agno
version: 0.0.0
description: "CLI tool: agno. Use this skill whenever the user works with agno or tasks related to cli tool: agno — even if they don't mention "agno" by name."
ingredients:
  - agno-agi/agno
tags:
  - cli
---

# agno

CLI tool: agno

## Overview

agno provides cli tool: agno. Agents benefit from agno because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add agno-agi/agno

# Or clone from GitHub
git clone https://github.com/agno-agi/agno.git
```

## Usage

```bash
# Show help and available options
agno --help

# Check version
agno --version
```

Refer to the project documentation for detailed usage:
- https://github.com/agno-agi/agno

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add agno-agi/agno

# 2. Verify installation
agents-cli run agno -- --version

# 3. Explore capabilities
agents-cli schema agno --json
```

### Piping with other tools

```bash
# Chain agno output with jq for structured processing
agents-cli run agno -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run agno -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run agno -- --help --json

# Introspect full command schema
agents-cli schema agno --json

# Dry-run before executing (safe exploration)
agents-cli run agno -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe agno --json
```

## When to Use This Tool

Use `agno` when:
- Your task involves cli tool: agno
- A task requires agno-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what agno provides
