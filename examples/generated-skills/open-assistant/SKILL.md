---
name: Open-Assistant
version: 0.0.0
description: "CLI tool: Open-Assistant. Use this skill whenever the user works with Open-Assistant or tasks related to cli tool: open-assistant — even if they don't mention "Open-Assistant" by name."
ingredients:
  - LAION-AI/Open-Assistant
tags:
  - cli
---

# Open-Assistant

CLI tool: Open-Assistant

## Overview

Open-Assistant provides cli tool: open-assistant. Agents benefit from Open-Assistant because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add LAION-AI/Open-Assistant

# Or clone from GitHub
git clone https://github.com/LAION-AI/Open-Assistant.git
```

## Usage

```bash
# Show help and available options
Open-Assistant --help

# Check version
Open-Assistant --version
```

Refer to the project documentation for detailed usage:
- https://github.com/LAION-AI/Open-Assistant

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add LAION-AI/Open-Assistant

# 2. Verify installation
agents-cli run Open-Assistant -- --version

# 3. Explore capabilities
agents-cli schema Open-Assistant --json
```

### Piping with other tools

```bash
# Chain Open-Assistant output with jq for structured processing
agents-cli run Open-Assistant -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run Open-Assistant -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run Open-Assistant -- --help --json

# Introspect full command schema
agents-cli schema Open-Assistant --json

# Dry-run before executing (safe exploration)
agents-cli run Open-Assistant -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe Open-Assistant --json
```

## When to Use This Tool

Use `Open-Assistant` when:
- Your task involves cli tool: open-assistant
- A task requires Open-Assistant-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what Open-Assistant provides
