---
name: supervision
version: 0.0.0
description: "CLI tool: supervision. Use this skill whenever the user works with supervision or tasks related to cli tool: supervision — even if they don't mention "supervision" by name."
ingredients:
  - roboflow/supervision
tags:
  - cli
---

# supervision

CLI tool: supervision

## Overview

supervision provides cli tool: supervision. Agents benefit from supervision because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add roboflow/supervision

# Or clone from GitHub
git clone https://github.com/roboflow/supervision.git
```

## Usage

```bash
# Show help and available options
supervision --help

# Check version
supervision --version
```

Refer to the project documentation for detailed usage:
- https://github.com/roboflow/supervision

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add roboflow/supervision

# 2. Verify installation
agents-cli run supervision -- --version

# 3. Explore capabilities
agents-cli schema supervision --json
```

### Piping with other tools

```bash
# Chain supervision output with jq for structured processing
agents-cli run supervision -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run supervision -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run supervision -- --help --json

# Introspect full command schema
agents-cli schema supervision --json

# Dry-run before executing (safe exploration)
agents-cli run supervision -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe supervision --json
```

## When to Use This Tool

Use `supervision` when:
- Your task involves cli tool: supervision
- A task requires supervision-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what supervision provides
