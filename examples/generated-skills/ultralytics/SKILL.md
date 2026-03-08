---
name: ultralytics
version: 0.0.0
description: "CLI tool: ultralytics. Use this skill whenever the user works with ultralytics or tasks related to cli tool: ultralytics — even if they don't mention "ultralytics" by name."
ingredients:
  - ultralytics/ultralytics
tags:
  - cli
---

# ultralytics

CLI tool: ultralytics

## Overview

ultralytics provides cli tool: ultralytics. Agents benefit from ultralytics because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add ultralytics/ultralytics

# Or clone from GitHub
git clone https://github.com/ultralytics/ultralytics.git
```

## Usage

```bash
# Show help and available options
ultralytics --help

# Check version
ultralytics --version
```

Refer to the project documentation for detailed usage:
- https://github.com/ultralytics/ultralytics

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add ultralytics/ultralytics

# 2. Verify installation
agents-cli run ultralytics -- --version

# 3. Explore capabilities
agents-cli schema ultralytics --json
```

### Piping with other tools

```bash
# Chain ultralytics output with jq for structured processing
agents-cli run ultralytics -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run ultralytics -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run ultralytics -- --help --json

# Introspect full command schema
agents-cli schema ultralytics --json

# Dry-run before executing (safe exploration)
agents-cli run ultralytics -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe ultralytics --json
```

## When to Use This Tool

Use `ultralytics` when:
- Your task involves cli tool: ultralytics
- A task requires ultralytics-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what ultralytics provides
