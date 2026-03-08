---
name: aider
version: 0.0.0
description: "CLI tool: aider. Use this skill whenever the user works with aider or tasks related to cli tool: aider — even if they don't mention "aider" by name."
ingredients:
  - paul-gauthier/aider
tags:
  - cli
---

# aider

CLI tool: aider

## Overview

aider provides cli tool: aider. Agents benefit from aider because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add paul-gauthier/aider

# Or clone from GitHub
git clone https://github.com/paul-gauthier/aider.git
```

## Usage

```bash
# Show help and available options
aider --help

# Check version
aider --version
```

Refer to the project documentation for detailed usage:
- https://github.com/paul-gauthier/aider

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add paul-gauthier/aider

# 2. Verify installation
agents-cli run aider -- --version

# 3. Explore capabilities
agents-cli schema aider --json
```

### Piping with other tools

```bash
# Chain aider output with jq for structured processing
agents-cli run aider -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run aider -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run aider -- --help --json

# Introspect full command schema
agents-cli schema aider --json

# Dry-run before executing (safe exploration)
agents-cli run aider -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe aider --json
```

## When to Use This Tool

Use `aider` when:
- Your task involves cli tool: aider
- A task requires aider-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what aider provides
