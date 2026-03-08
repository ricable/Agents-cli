---
name: jupytext
version: 0.0.0
description: "CLI tool: jupytext. Use this skill whenever the user works with jupytext or tasks related to cli tool: jupytext — even if they don't mention "jupytext" by name."
ingredients:
  - mwouts/jupytext
tags:
  - cli
---

# jupytext

CLI tool: jupytext

## Overview

jupytext provides cli tool: jupytext. Agents benefit from jupytext because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add mwouts/jupytext

# Or clone from GitHub
git clone https://github.com/mwouts/jupytext.git
```

## Usage

```bash
# Show help and available options
jupytext --help

# Check version
jupytext --version
```

Refer to the project documentation for detailed usage:
- https://github.com/mwouts/jupytext

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add mwouts/jupytext

# 2. Verify installation
agents-cli run jupytext -- --version

# 3. Explore capabilities
agents-cli schema jupytext --json
```

### Piping with other tools

```bash
# Chain jupytext output with jq for structured processing
agents-cli run jupytext -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run jupytext -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run jupytext -- --help --json

# Introspect full command schema
agents-cli schema jupytext --json

# Dry-run before executing (safe exploration)
agents-cli run jupytext -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe jupytext --json
```

## When to Use This Tool

Use `jupytext` when:
- Your task involves cli tool: jupytext
- A task requires jupytext-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what jupytext provides
