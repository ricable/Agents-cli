---
name: lm-format-enforcer
version: 0.0.0
description: "CLI tool: lm-format-enforcer. Use this skill whenever the user works with lm-format-enforcer or tasks related to cli tool: lm-format-enforcer — even if they don't mention "lm-format-enforcer" by name."
ingredients:
  - noamgat/lm-format-enforcer
tags:
  - cli
---

# lm-format-enforcer

CLI tool: lm-format-enforcer

## Overview

lm-format-enforcer provides cli tool: lm-format-enforcer. Agents benefit from lm-format-enforcer because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add noamgat/lm-format-enforcer

# Or clone from GitHub
git clone https://github.com/noamgat/lm-format-enforcer.git
```

## Usage

```bash
# Show help and available options
lm-format-enforcer --help

# Check version
lm-format-enforcer --version
```

Refer to the project documentation for detailed usage:
- https://github.com/noamgat/lm-format-enforcer

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add noamgat/lm-format-enforcer

# 2. Verify installation
agents-cli run lm-format-enforcer -- --version

# 3. Explore capabilities
agents-cli schema lm-format-enforcer --json
```

### Piping with other tools

```bash
# Chain lm-format-enforcer output with jq for structured processing
agents-cli run lm-format-enforcer -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run lm-format-enforcer -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run lm-format-enforcer -- --help --json

# Introspect full command schema
agents-cli schema lm-format-enforcer --json

# Dry-run before executing (safe exploration)
agents-cli run lm-format-enforcer -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe lm-format-enforcer --json
```

## When to Use This Tool

Use `lm-format-enforcer` when:
- Your task involves cli tool: lm-format-enforcer
- A task requires lm-format-enforcer-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what lm-format-enforcer provides
