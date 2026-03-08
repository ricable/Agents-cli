---
name: hamilton
version: 0.0.0
description: "CLI tool: hamilton. Use this skill whenever the user works with hamilton or tasks related to cli tool: hamilton — even if they don't mention "hamilton" by name."
ingredients:
  - DAGWorks-Inc/hamilton
tags:
  - cli
---

# hamilton

CLI tool: hamilton

## Overview

hamilton provides cli tool: hamilton. Agents benefit from hamilton because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add DAGWorks-Inc/hamilton

# Or clone from GitHub
git clone https://github.com/DAGWorks-Inc/hamilton.git
```

## Usage

```bash
# Show help and available options
hamilton --help

# Check version
hamilton --version
```

Refer to the project documentation for detailed usage:
- https://github.com/DAGWorks-Inc/hamilton

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add DAGWorks-Inc/hamilton

# 2. Verify installation
agents-cli run hamilton -- --version

# 3. Explore capabilities
agents-cli schema hamilton --json
```

### Piping with other tools

```bash
# Chain hamilton output with jq for structured processing
agents-cli run hamilton -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run hamilton -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run hamilton -- --help --json

# Introspect full command schema
agents-cli schema hamilton --json

# Dry-run before executing (safe exploration)
agents-cli run hamilton -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe hamilton --json
```

## When to Use This Tool

Use `hamilton` when:
- Your task involves cli tool: hamilton
- A task requires hamilton-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what hamilton provides
