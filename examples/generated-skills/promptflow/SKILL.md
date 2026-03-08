---
name: promptflow
version: 0.0.0
description: "CLI tool: promptflow. Use this skill whenever the user works with promptflow or tasks related to cli tool: promptflow — even if they don't mention "promptflow" by name."
ingredients:
  - microsoft/promptflow
tags:
  - cli
---

# promptflow

CLI tool: promptflow

## Overview

promptflow provides cli tool: promptflow. Agents benefit from promptflow because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add microsoft/promptflow

# Or clone from GitHub
git clone https://github.com/microsoft/promptflow.git
```

## Usage

```bash
# Show help and available options
promptflow --help

# Check version
promptflow --version
```

Refer to the project documentation for detailed usage:
- https://github.com/microsoft/promptflow

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add microsoft/promptflow

# 2. Verify installation
agents-cli run promptflow -- --version

# 3. Explore capabilities
agents-cli schema promptflow --json
```

### Piping with other tools

```bash
# Chain promptflow output with jq for structured processing
agents-cli run promptflow -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run promptflow -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run promptflow -- --help --json

# Introspect full command schema
agents-cli schema promptflow --json

# Dry-run before executing (safe exploration)
agents-cli run promptflow -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe promptflow --json
```

## When to Use This Tool

Use `promptflow` when:
- Your task involves cli tool: promptflow
- A task requires promptflow-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what promptflow provides
