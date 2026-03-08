---
name: pandoc
version: 0.0.0
description: "CLI tool: pandoc. Use this skill whenever the user works with pandoc or tasks related to cli tool: pandoc — even if they don't mention "pandoc" by name."
ingredients:
  - jgm/pandoc
tags:
  - cli
---

# pandoc

CLI tool: pandoc

## Overview

pandoc provides cli tool: pandoc. Agents benefit from pandoc because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add jgm/pandoc

# Or clone from GitHub
git clone https://github.com/jgm/pandoc.git
```

## Usage

```bash
# Show help and available options
pandoc --help

# Check version
pandoc --version
```

Refer to the project documentation for detailed usage:
- https://github.com/jgm/pandoc

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add jgm/pandoc

# 2. Verify installation
agents-cli run pandoc -- --version

# 3. Explore capabilities
agents-cli schema pandoc --json
```

### Piping with other tools

```bash
# Chain pandoc output with jq for structured processing
agents-cli run pandoc -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run pandoc -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run pandoc -- --help --json

# Introspect full command schema
agents-cli schema pandoc --json

# Dry-run before executing (safe exploration)
agents-cli run pandoc -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe pandoc --json
```

## When to Use This Tool

Use `pandoc` when:
- Your task involves cli tool: pandoc
- A task requires pandoc-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what pandoc provides
