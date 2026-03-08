---
name: trigger.dev
version: 0.0.1
description: "CLI tool: trigger.dev. Use this skill whenever the user works with trigger.dev or tasks related to cli tool: trigger.dev — even if they don't mention "trigger.dev" by name."
ingredients:
  - triggerdotdev/trigger.dev
tags:
  - cli
---

# trigger.dev

CLI tool: trigger.dev

## Overview

trigger.dev provides cli tool: trigger.dev. Agents benefit from trigger.dev because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add triggerdotdev/trigger.dev

# Or clone from GitHub
git clone https://github.com/triggerdotdev/trigger.dev.git
```

## Usage

```bash
# Show help and available options
trigger.dev --help

# Check version
trigger.dev --version
```

Refer to the project documentation for detailed usage:
- https://github.com/triggerdotdev/trigger.dev

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add triggerdotdev/trigger.dev

# 2. Verify installation
agents-cli run trigger.dev -- --version

# 3. Explore capabilities
agents-cli schema trigger.dev --json
```

### Piping with other tools

```bash
# Chain trigger.dev output with jq for structured processing
agents-cli run trigger.dev -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run trigger.dev -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run trigger.dev -- --help --json

# Introspect full command schema
agents-cli schema trigger.dev --json

# Dry-run before executing (safe exploration)
agents-cli run trigger.dev -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe trigger.dev --json
```

## When to Use This Tool

Use `trigger.dev` when:
- Your task involves cli tool: trigger.dev
- A task requires trigger.dev-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what trigger.dev provides
