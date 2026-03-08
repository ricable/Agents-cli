---
name: sd-scripts
version: 0.0.0
description: "CLI tool: sd-scripts. Use this skill whenever the user works with sd-scripts or tasks related to cli tool: sd-scripts — even if they don't mention "sd-scripts" by name."
ingredients:
  - kohya-ss/sd-scripts
tags:
  - cli
---

# sd-scripts

CLI tool: sd-scripts

## Overview

sd-scripts provides cli tool: sd-scripts. Agents benefit from sd-scripts because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add kohya-ss/sd-scripts

# Or clone from GitHub
git clone https://github.com/kohya-ss/sd-scripts.git
```

## Usage

```bash
# Show help and available options
sd-scripts --help

# Check version
sd-scripts --version
```

Refer to the project documentation for detailed usage:
- https://github.com/kohya-ss/sd-scripts

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add kohya-ss/sd-scripts

# 2. Verify installation
agents-cli run sd-scripts -- --version

# 3. Explore capabilities
agents-cli schema sd-scripts --json
```

### Piping with other tools

```bash
# Chain sd-scripts output with jq for structured processing
agents-cli run sd-scripts -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run sd-scripts -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run sd-scripts -- --help --json

# Introspect full command schema
agents-cli schema sd-scripts --json

# Dry-run before executing (safe exploration)
agents-cli run sd-scripts -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe sd-scripts --json
```

## When to Use This Tool

Use `sd-scripts` when:
- Your task involves cli tool: sd-scripts
- A task requires sd-scripts-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what sd-scripts provides
