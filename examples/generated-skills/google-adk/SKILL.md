---
name: adk-python
version: 0.0.0
description: "CLI tool: adk-python. Use this skill whenever the user works with adk-python or tasks related to cli tool: adk-python — even if they don't mention "adk-python" by name."
ingredients:
  - google/adk-python
tags:
  - cli
---

# adk-python

CLI tool: adk-python

## Overview

adk-python provides cli tool: adk-python. Agents benefit from adk-python because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add google/adk-python

# Or clone from GitHub
git clone https://github.com/google/adk-python.git
```

## Usage

```bash
# Show help and available options
adk-python --help

# Check version
adk-python --version
```

Refer to the project documentation for detailed usage:
- https://github.com/google/adk-python

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add google/adk-python

# 2. Verify installation
agents-cli run adk-python -- --version

# 3. Explore capabilities
agents-cli schema adk-python --json
```

### Piping with other tools

```bash
# Chain adk-python output with jq for structured processing
agents-cli run adk-python -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run adk-python -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run adk-python -- --help --json

# Introspect full command schema
agents-cli schema adk-python --json

# Dry-run before executing (safe exploration)
agents-cli run adk-python -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe adk-python --json
```

## When to Use This Tool

Use `adk-python` when:
- Your task involves cli tool: adk-python
- A task requires adk-python-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what adk-python provides
