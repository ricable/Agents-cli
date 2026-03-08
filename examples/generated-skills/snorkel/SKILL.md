---
name: snorkel
version: 0.0.0
description: "CLI tool: snorkel. Use this skill whenever the user works with snorkel or tasks related to cli tool: snorkel — even if they don't mention "snorkel" by name."
ingredients:
  - snorkel-team/snorkel
tags:
  - cli
---

# snorkel

CLI tool: snorkel

## Overview

snorkel provides cli tool: snorkel. Agents benefit from snorkel because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add snorkel-team/snorkel

# Or clone from GitHub
git clone https://github.com/snorkel-team/snorkel.git
```

## Usage

```bash
# Show help and available options
snorkel --help

# Check version
snorkel --version
```

Refer to the project documentation for detailed usage:
- https://github.com/snorkel-team/snorkel

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add snorkel-team/snorkel

# 2. Verify installation
agents-cli run snorkel -- --version

# 3. Explore capabilities
agents-cli schema snorkel --json
```

### Piping with other tools

```bash
# Chain snorkel output with jq for structured processing
agents-cli run snorkel -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run snorkel -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run snorkel -- --help --json

# Introspect full command schema
agents-cli schema snorkel --json

# Dry-run before executing (safe exploration)
agents-cli run snorkel -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe snorkel --json
```

## When to Use This Tool

Use `snorkel` when:
- Your task involves cli tool: snorkel
- A task requires snorkel-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what snorkel provides
