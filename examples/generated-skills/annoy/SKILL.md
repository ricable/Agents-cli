---
name: annoy
version: 0.0.0
description: "CLI tool: annoy. Use this skill whenever the user works with annoy or tasks related to cli tool: annoy — even if they don't mention "annoy" by name."
ingredients:
  - spotify/annoy
tags:
  - cli
---

# annoy

CLI tool: annoy

## Overview

annoy provides cli tool: annoy. Agents benefit from annoy because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add spotify/annoy

# Or clone from GitHub
git clone https://github.com/spotify/annoy.git
```

## Usage

```bash
# Show help and available options
annoy --help

# Check version
annoy --version
```

Refer to the project documentation for detailed usage:
- https://github.com/spotify/annoy

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add spotify/annoy

# 2. Verify installation
agents-cli run annoy -- --version

# 3. Explore capabilities
agents-cli schema annoy --json
```

### Piping with other tools

```bash
# Chain annoy output with jq for structured processing
agents-cli run annoy -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run annoy -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run annoy -- --help --json

# Introspect full command schema
agents-cli schema annoy --json

# Dry-run before executing (safe exploration)
agents-cli run annoy -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe annoy --json
```

## When to Use This Tool

Use `annoy` when:
- Your task involves cli tool: annoy
- A task requires annoy-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what annoy provides
