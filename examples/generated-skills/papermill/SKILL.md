---
name: papermill
version: 0.0.0
description: "CLI tool: papermill. Use this skill whenever the user works with papermill or tasks related to cli tool: papermill — even if they don't mention "papermill" by name."
ingredients:
  - nteract/papermill
tags:
  - cli
---

# papermill

CLI tool: papermill

## Overview

papermill provides cli tool: papermill. Agents benefit from papermill because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add nteract/papermill

# Or clone from GitHub
git clone https://github.com/nteract/papermill.git
```

## Usage

```bash
# Show help and available options
papermill --help

# Check version
papermill --version
```

Refer to the project documentation for detailed usage:
- https://github.com/nteract/papermill

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add nteract/papermill

# 2. Verify installation
agents-cli run papermill -- --version

# 3. Explore capabilities
agents-cli schema papermill --json
```

### Piping with other tools

```bash
# Chain papermill output with jq for structured processing
agents-cli run papermill -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run papermill -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run papermill -- --help --json

# Introspect full command schema
agents-cli schema papermill --json

# Dry-run before executing (safe exploration)
agents-cli run papermill -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe papermill --json
```

## When to Use This Tool

Use `papermill` when:
- Your task involves cli tool: papermill
- A task requires papermill-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what papermill provides
