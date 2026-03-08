---
name: DataDreamer
version: 0.0.0
description: "CLI tool: DataDreamer. Use this skill whenever the user works with DataDreamer or tasks related to cli tool: datadreamer — even if they don't mention "DataDreamer" by name."
ingredients:
  - datadreamer-dev/DataDreamer
tags:
  - cli
---

# DataDreamer

CLI tool: DataDreamer

## Overview

DataDreamer provides cli tool: datadreamer. Agents benefit from DataDreamer because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add datadreamer-dev/DataDreamer

# Or clone from GitHub
git clone https://github.com/datadreamer-dev/DataDreamer.git
```

## Usage

```bash
# Show help and available options
DataDreamer --help

# Check version
DataDreamer --version
```

Refer to the project documentation for detailed usage:
- https://github.com/datadreamer-dev/DataDreamer

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add datadreamer-dev/DataDreamer

# 2. Verify installation
agents-cli run DataDreamer -- --version

# 3. Explore capabilities
agents-cli schema DataDreamer --json
```

### Piping with other tools

```bash
# Chain DataDreamer output with jq for structured processing
agents-cli run DataDreamer -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run DataDreamer -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run DataDreamer -- --help --json

# Introspect full command schema
agents-cli schema DataDreamer --json

# Dry-run before executing (safe exploration)
agents-cli run DataDreamer -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe DataDreamer --json
```

## When to Use This Tool

Use `DataDreamer` when:
- Your task involves cli tool: datadreamer
- A task requires DataDreamer-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what DataDreamer provides
