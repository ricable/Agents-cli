---
name: swc
version: 1.5.30-nightly-20240614.2
description: "CLI tool: swc. Use this skill whenever the user works with swc or tasks related to cli tool: swc — even if they don't mention "swc" by name."
ingredients:
  - swc-project/swc
tags:
  - cli
---

# swc

CLI tool: swc

## Overview

swc provides cli tool: swc. Agents benefit from swc because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add swc-project/swc

# Or clone from GitHub
git clone https://github.com/swc-project/swc.git
```

## Usage

```bash
# Show help and available options
swc --help

# Check version
swc --version
```

Refer to the project documentation for detailed usage:
- https://github.com/swc-project/swc

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add swc-project/swc

# 2. Verify installation
agents-cli run swc -- --version

# 3. Explore capabilities
agents-cli schema swc --json
```

### Piping with other tools

```bash
# Chain swc output with jq for structured processing
agents-cli run swc -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run swc -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run swc -- --help --json

# Introspect full command schema
agents-cli schema swc --json

# Dry-run before executing (safe exploration)
agents-cli run swc -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe swc --json
```

## When to Use This Tool

Use `swc` when:
- Your task involves cli tool: swc
- A task requires swc-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what swc provides
