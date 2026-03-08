---
name: labelme
version: 0.0.0
description: "CLI tool: labelme. Use this skill whenever the user works with labelme or tasks related to cli tool: labelme — even if they don't mention "labelme" by name."
ingredients:
  - labelmeai/labelme
tags:
  - cli
---

# labelme

CLI tool: labelme

## Overview

labelme provides cli tool: labelme. Agents benefit from labelme because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add labelmeai/labelme

# Or clone from GitHub
git clone https://github.com/labelmeai/labelme.git
```

## Usage

```bash
# Show help and available options
labelme --help

# Check version
labelme --version
```

Refer to the project documentation for detailed usage:
- https://github.com/labelmeai/labelme

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add labelmeai/labelme

# 2. Verify installation
agents-cli run labelme -- --version

# 3. Explore capabilities
agents-cli schema labelme --json
```

### Piping with other tools

```bash
# Chain labelme output with jq for structured processing
agents-cli run labelme -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run labelme -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run labelme -- --help --json

# Introspect full command schema
agents-cli schema labelme --json

# Dry-run before executing (safe exploration)
agents-cli run labelme -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe labelme --json
```

## When to Use This Tool

Use `labelme` when:
- Your task involves cli tool: labelme
- A task requires labelme-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what labelme provides
