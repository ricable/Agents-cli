---
name: panel
version: 0.0.0
description: "CLI tool: panel. Use this skill whenever the user works with panel or tasks related to cli tool: panel — even if they don't mention "panel" by name."
ingredients:
  - holoviz/panel
tags:
  - cli
---

# panel

CLI tool: panel

## Overview

panel provides cli tool: panel. Agents benefit from panel because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add holoviz/panel

# Or clone from GitHub
git clone https://github.com/holoviz/panel.git
```

## Usage

```bash
# Show help and available options
panel --help

# Check version
panel --version
```

Refer to the project documentation for detailed usage:
- https://github.com/holoviz/panel

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add holoviz/panel

# 2. Verify installation
agents-cli run panel -- --version

# 3. Explore capabilities
agents-cli schema panel --json
```

### Piping with other tools

```bash
# Chain panel output with jq for structured processing
agents-cli run panel -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run panel -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run panel -- --help --json

# Introspect full command schema
agents-cli schema panel --json

# Dry-run before executing (safe exploration)
agents-cli run panel -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe panel --json
```

## When to Use This Tool

Use `panel` when:
- Your task involves cli tool: panel
- A task requires panel-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what panel provides
