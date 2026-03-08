---
name: prefect
version: 0.0.0
description: "CLI tool: prefect. Use this skill whenever the user works with prefect or tasks related to cli tool: prefect — even if they don't mention "prefect" by name."
ingredients:
  - PrefectHQ/prefect
tags:
  - cli
---

# prefect

CLI tool: prefect

## Overview

prefect provides cli tool: prefect. Agents benefit from prefect because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add PrefectHQ/prefect

# Or clone from GitHub
git clone https://github.com/PrefectHQ/prefect.git
```

## Usage

```bash
# Show help and available options
prefect --help

# Check version
prefect --version
```

Refer to the project documentation for detailed usage:
- https://github.com/PrefectHQ/prefect

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add PrefectHQ/prefect

# 2. Verify installation
agents-cli run prefect -- --version

# 3. Explore capabilities
agents-cli schema prefect --json
```

### Piping with other tools

```bash
# Chain prefect output with jq for structured processing
agents-cli run prefect -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run prefect -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run prefect -- --help --json

# Introspect full command schema
agents-cli schema prefect --json

# Dry-run before executing (safe exploration)
agents-cli run prefect -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe prefect --json
```

## When to Use This Tool

Use `prefect` when:
- Your task involves cli tool: prefect
- A task requires prefect-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what prefect provides
