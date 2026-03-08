---
name: distilabel
version: 0.0.0
description: "CLI tool: distilabel. Use this skill whenever the user works with distilabel or tasks related to cli tool: distilabel — even if they don't mention "distilabel" by name."
ingredients:
  - argilla-io/distilabel
tags:
  - cli
---

# distilabel

CLI tool: distilabel

## Overview

distilabel provides cli tool: distilabel. Agents benefit from distilabel because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add argilla-io/distilabel

# Or clone from GitHub
git clone https://github.com/argilla-io/distilabel.git
```

## Usage

```bash
# Show help and available options
distilabel --help

# Check version
distilabel --version
```

Refer to the project documentation for detailed usage:
- https://github.com/argilla-io/distilabel

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add argilla-io/distilabel

# 2. Verify installation
agents-cli run distilabel -- --version

# 3. Explore capabilities
agents-cli schema distilabel --json
```

### Piping with other tools

```bash
# Chain distilabel output with jq for structured processing
agents-cli run distilabel -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run distilabel -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run distilabel -- --help --json

# Introspect full command schema
agents-cli schema distilabel --json

# Dry-run before executing (safe exploration)
agents-cli run distilabel -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe distilabel --json
```

## When to Use This Tool

Use `distilabel` when:
- Your task involves cli tool: distilabel
- A task requires distilabel-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what distilabel provides
