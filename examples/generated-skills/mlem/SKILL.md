---
name: mlem
version: 0.0.0
description: "CLI tool: mlem. Use this skill whenever the user works with mlem or tasks related to cli tool: mlem — even if they don't mention "mlem" by name."
ingredients:
  - iterative/mlem
tags:
  - cli
---

# mlem

CLI tool: mlem

## Overview

mlem provides cli tool: mlem. Agents benefit from mlem because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add iterative/mlem

# Or clone from GitHub
git clone https://github.com/iterative/mlem.git
```

## Usage

```bash
# Show help and available options
mlem --help

# Check version
mlem --version
```

Refer to the project documentation for detailed usage:
- https://github.com/iterative/mlem

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add iterative/mlem

# 2. Verify installation
agents-cli run mlem -- --version

# 3. Explore capabilities
agents-cli schema mlem --json
```

### Piping with other tools

```bash
# Chain mlem output with jq for structured processing
agents-cli run mlem -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run mlem -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run mlem -- --help --json

# Introspect full command schema
agents-cli schema mlem --json

# Dry-run before executing (safe exploration)
agents-cli run mlem -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe mlem --json
```

## When to Use This Tool

Use `mlem` when:
- Your task involves cli tool: mlem
- A task requires mlem-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what mlem provides
