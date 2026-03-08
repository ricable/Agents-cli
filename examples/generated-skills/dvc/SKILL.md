---
name: dvc
version: 0.0.0
description: "CLI tool: dvc. Use this skill whenever the user works with dvc or tasks related to cli tool: dvc — even if they don't mention "dvc" by name."
ingredients:
  - iterative/dvc
tags:
  - cli
---

# dvc

CLI tool: dvc

## Overview

dvc provides cli tool: dvc. Agents benefit from dvc because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add iterative/dvc

# Or clone from GitHub
git clone https://github.com/iterative/dvc.git
```

## Usage

```bash
# Show help and available options
dvc --help

# Check version
dvc --version
```

Refer to the project documentation for detailed usage:
- https://github.com/iterative/dvc

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add iterative/dvc

# 2. Verify installation
agents-cli run dvc -- --version

# 3. Explore capabilities
agents-cli schema dvc --json
```

### Piping with other tools

```bash
# Chain dvc output with jq for structured processing
agents-cli run dvc -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run dvc -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run dvc -- --help --json

# Introspect full command schema
agents-cli schema dvc --json

# Dry-run before executing (safe exploration)
agents-cli run dvc -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe dvc --json
```

## When to Use This Tool

Use `dvc` when:
- Your task involves cli tool: dvc
- A task requires dvc-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what dvc provides
