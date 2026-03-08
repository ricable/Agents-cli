---
name: llmsherpa
version: 0.0.0
description: "CLI tool: llmsherpa. Use this skill whenever the user works with llmsherpa or tasks related to cli tool: llmsherpa — even if they don't mention "llmsherpa" by name."
ingredients:
  - nlmatics/llmsherpa
tags:
  - cli
---

# llmsherpa

CLI tool: llmsherpa

## Overview

llmsherpa provides cli tool: llmsherpa. Agents benefit from llmsherpa because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add nlmatics/llmsherpa

# Or clone from GitHub
git clone https://github.com/nlmatics/llmsherpa.git
```

## Usage

```bash
# Show help and available options
llmsherpa --help

# Check version
llmsherpa --version
```

Refer to the project documentation for detailed usage:
- https://github.com/nlmatics/llmsherpa

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add nlmatics/llmsherpa

# 2. Verify installation
agents-cli run llmsherpa -- --version

# 3. Explore capabilities
agents-cli schema llmsherpa --json
```

### Piping with other tools

```bash
# Chain llmsherpa output with jq for structured processing
agents-cli run llmsherpa -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run llmsherpa -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run llmsherpa -- --help --json

# Introspect full command schema
agents-cli schema llmsherpa --json

# Dry-run before executing (safe exploration)
agents-cli run llmsherpa -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe llmsherpa --json
```

## When to Use This Tool

Use `llmsherpa` when:
- Your task involves cli tool: llmsherpa
- A task requires llmsherpa-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what llmsherpa provides
