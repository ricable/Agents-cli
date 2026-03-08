---
name: swarm
version: 0.0.0
description: "CLI tool: swarm. Use this skill whenever the user works with swarm or tasks related to cli tool: swarm — even if they don't mention "swarm" by name."
ingredients:
  - openai/swarm
tags:
  - cli
---

# swarm

CLI tool: swarm

## Overview

swarm provides cli tool: swarm. Agents benefit from swarm because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add openai/swarm

# Or clone from GitHub
git clone https://github.com/openai/swarm.git
```

## Usage

```bash
# Show help and available options
swarm --help

# Check version
swarm --version
```

Refer to the project documentation for detailed usage:
- https://github.com/openai/swarm

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add openai/swarm

# 2. Verify installation
agents-cli run swarm -- --version

# 3. Explore capabilities
agents-cli schema swarm --json
```

### Piping with other tools

```bash
# Chain swarm output with jq for structured processing
agents-cli run swarm -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run swarm -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run swarm -- --help --json

# Introspect full command schema
agents-cli schema swarm --json

# Dry-run before executing (safe exploration)
agents-cli run swarm -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe swarm --json
```

## When to Use This Tool

Use `swarm` when:
- Your task involves cli tool: swarm
- A task requires swarm-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what swarm provides
