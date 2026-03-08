---
name: civitai
version: 5.0.1464
description: "CLI tool: civitai. Use this skill whenever the user works with civitai or tasks related to cli tool: civitai — even if they don't mention "civitai" by name."
ingredients:
  - civitai/civitai
tags:
  - cli
---

# civitai

CLI tool: civitai

## Overview

civitai provides cli tool: civitai. Agents benefit from civitai because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add civitai/civitai

# Or clone from GitHub
git clone https://github.com/civitai/civitai.git
```

## Usage

```bash
# Show help and available options
civitai --help

# Check version
civitai --version
```

Refer to the project documentation for detailed usage:
- https://github.com/civitai/civitai

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add civitai/civitai

# 2. Verify installation
agents-cli run civitai -- --version

# 3. Explore capabilities
agents-cli schema civitai --json
```

### Piping with other tools

```bash
# Chain civitai output with jq for structured processing
agents-cli run civitai -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run civitai -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run civitai -- --help --json

# Introspect full command schema
agents-cli schema civitai --json

# Dry-run before executing (safe exploration)
agents-cli run civitai -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe civitai --json
```

## When to Use This Tool

Use `civitai` when:
- Your task involves cli tool: civitai
- A task requires civitai-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what civitai provides
