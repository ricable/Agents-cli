---
name: datafusion
version: 0.0.0
description: "CLI tool: datafusion. Use this skill whenever the user works with datafusion or tasks related to cli tool: datafusion — even if they don't mention "datafusion" by name."
ingredients:
  - apache/datafusion
tags:
  - cli
---

# datafusion

CLI tool: datafusion

## Overview

datafusion provides cli tool: datafusion. Agents benefit from datafusion because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add apache/datafusion

# Or clone from GitHub
git clone https://github.com/apache/datafusion.git
```

## Usage

```bash
# Show help and available options
datafusion --help

# Check version
datafusion --version
```

Refer to the project documentation for detailed usage:
- https://github.com/apache/datafusion

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add apache/datafusion

# 2. Verify installation
agents-cli run datafusion -- --version

# 3. Explore capabilities
agents-cli schema datafusion --json
```

### Piping with other tools

```bash
# Chain datafusion output with jq for structured processing
agents-cli run datafusion -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run datafusion -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run datafusion -- --help --json

# Introspect full command schema
agents-cli schema datafusion --json

# Dry-run before executing (safe exploration)
agents-cli run datafusion -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe datafusion --json
```

## When to Use This Tool

Use `datafusion` when:
- Your task involves cli tool: datafusion
- A task requires datafusion-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what datafusion provides
