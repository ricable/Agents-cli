---
name: bark
version: 0.0.0
description: "CLI tool: bark. Use this skill whenever the user works with bark or tasks related to cli tool: bark — even if they don't mention "bark" by name."
ingredients:
  - suno-ai/bark
tags:
  - cli
---

# bark

CLI tool: bark

## Overview

bark provides cli tool: bark. Agents benefit from bark because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add suno-ai/bark

# Or clone from GitHub
git clone https://github.com/suno-ai/bark.git
```

## Usage

```bash
# Show help and available options
bark --help

# Check version
bark --version
```

Refer to the project documentation for detailed usage:
- https://github.com/suno-ai/bark

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add suno-ai/bark

# 2. Verify installation
agents-cli run bark -- --version

# 3. Explore capabilities
agents-cli schema bark --json
```

### Piping with other tools

```bash
# Chain bark output with jq for structured processing
agents-cli run bark -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run bark -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run bark -- --help --json

# Introspect full command schema
agents-cli schema bark --json

# Dry-run before executing (safe exploration)
agents-cli run bark -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe bark --json
```

## When to Use This Tool

Use `bark` when:
- Your task involves cli tool: bark
- A task requires bark-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what bark provides
