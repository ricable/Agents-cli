---
name: cline
version: 3.71.0
description: "CLI tool: cline. Use this skill whenever the user works with cline or tasks related to cli tool: cline — even if they don't mention "cline" by name."
ingredients:
  - cline/cline
tags:
  - cli
---

# cline

CLI tool: cline

## Overview

cline provides cli tool: cline. Agents benefit from cline because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add cline/cline

# Or clone from GitHub
git clone https://github.com/cline/cline.git
```

## Usage

```bash
# Show help and available options
cline --help

# Check version
cline --version
```

Refer to the project documentation for detailed usage:
- https://github.com/cline/cline

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add cline/cline

# 2. Verify installation
agents-cli run cline -- --version

# 3. Explore capabilities
agents-cli schema cline --json
```

### Piping with other tools

```bash
# Chain cline output with jq for structured processing
agents-cli run cline -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run cline -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run cline -- --help --json

# Introspect full command schema
agents-cli schema cline --json

# Dry-run before executing (safe exploration)
agents-cli run cline -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe cline --json
```

## When to Use This Tool

Use `cline` when:
- Your task involves cli tool: cline
- A task requires cline-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what cline provides
