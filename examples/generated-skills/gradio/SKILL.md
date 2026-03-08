---
name: gradio
version: 0.0.1
description: "CLI tool: gradio. Use this skill whenever the user works with gradio or tasks related to cli tool: gradio — even if they don't mention "gradio" by name."
ingredients:
  - gradio-app/gradio
tags:
  - cli
---

# gradio

CLI tool: gradio

## Overview

gradio provides cli tool: gradio. Agents benefit from gradio because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add gradio-app/gradio

# Or clone from GitHub
git clone https://github.com/gradio-app/gradio.git
```

## Usage

```bash
# Show help and available options
gradio --help

# Check version
gradio --version
```

Refer to the project documentation for detailed usage:
- https://github.com/gradio-app/gradio

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add gradio-app/gradio

# 2. Verify installation
agents-cli run gradio -- --version

# 3. Explore capabilities
agents-cli schema gradio --json
```

### Piping with other tools

```bash
# Chain gradio output with jq for structured processing
agents-cli run gradio -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run gradio -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run gradio -- --help --json

# Introspect full command schema
agents-cli schema gradio --json

# Dry-run before executing (safe exploration)
agents-cli run gradio -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe gradio --json
```

## When to Use This Tool

Use `gradio` when:
- Your task involves cli tool: gradio
- A task requires gradio-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what gradio provides
