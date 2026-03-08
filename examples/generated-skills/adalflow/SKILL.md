---
name: AdalFlow
version: 0.0.0
description: "CLI tool: AdalFlow. Use this skill whenever the user works with AdalFlow or tasks related to cli tool: adalflow — even if they don't mention "AdalFlow" by name."
ingredients:
  - SylphAI-Inc/AdalFlow
tags:
  - cli
---

# AdalFlow

CLI tool: AdalFlow

## Overview

AdalFlow provides cli tool: adalflow. Agents benefit from AdalFlow because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add SylphAI-Inc/AdalFlow

# Or clone from GitHub
git clone https://github.com/SylphAI-Inc/AdalFlow.git
```

## Usage

```bash
# Show help and available options
AdalFlow --help

# Check version
AdalFlow --version
```

Refer to the project documentation for detailed usage:
- https://github.com/SylphAI-Inc/AdalFlow

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add SylphAI-Inc/AdalFlow

# 2. Verify installation
agents-cli run AdalFlow -- --version

# 3. Explore capabilities
agents-cli schema AdalFlow --json
```

### Piping with other tools

```bash
# Chain AdalFlow output with jq for structured processing
agents-cli run AdalFlow -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run AdalFlow -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run AdalFlow -- --help --json

# Introspect full command schema
agents-cli schema AdalFlow --json

# Dry-run before executing (safe exploration)
agents-cli run AdalFlow -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe AdalFlow --json
```

## When to Use This Tool

Use `AdalFlow` when:
- Your task involves cli tool: adalflow
- A task requires AdalFlow-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what AdalFlow provides
