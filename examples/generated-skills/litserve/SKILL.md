---
name: LitServe
version: 0.0.0
description: "CLI tool: LitServe. Use this skill whenever the user works with LitServe or tasks related to cli tool: litserve — even if they don't mention "LitServe" by name."
ingredients:
  - Lightning-AI/LitServe
tags:
  - cli
---

# LitServe

CLI tool: LitServe

## Overview

LitServe provides cli tool: litserve. Agents benefit from LitServe because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add Lightning-AI/LitServe

# Or clone from GitHub
git clone https://github.com/Lightning-AI/LitServe.git
```

## Usage

```bash
# Show help and available options
LitServe --help

# Check version
LitServe --version
```

Refer to the project documentation for detailed usage:
- https://github.com/Lightning-AI/LitServe

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add Lightning-AI/LitServe

# 2. Verify installation
agents-cli run LitServe -- --version

# 3. Explore capabilities
agents-cli schema LitServe --json
```

### Piping with other tools

```bash
# Chain LitServe output with jq for structured processing
agents-cli run LitServe -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run LitServe -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run LitServe -- --help --json

# Introspect full command schema
agents-cli schema LitServe --json

# Dry-run before executing (safe exploration)
agents-cli run LitServe -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe LitServe --json
```

## When to Use This Tool

Use `LitServe` when:
- Your task involves cli tool: litserve
- A task requires LitServe-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what LitServe provides
