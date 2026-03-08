---
name: haystack
version: 0.0.0
description: "CLI tool: haystack. Use this skill whenever the user works with haystack or tasks related to cli tool: haystack — even if they don't mention "haystack" by name."
ingredients:
  - deepset-ai/haystack
tags:
  - cli
---

# haystack

CLI tool: haystack

## Overview

haystack provides cli tool: haystack. Agents benefit from haystack because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add deepset-ai/haystack

# Or clone from GitHub
git clone https://github.com/deepset-ai/haystack.git
```

## Usage

```bash
# Show help and available options
haystack --help

# Check version
haystack --version
```

Refer to the project documentation for detailed usage:
- https://github.com/deepset-ai/haystack

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add deepset-ai/haystack

# 2. Verify installation
agents-cli run haystack -- --version

# 3. Explore capabilities
agents-cli schema haystack --json
```

### Piping with other tools

```bash
# Chain haystack output with jq for structured processing
agents-cli run haystack -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run haystack -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run haystack -- --help --json

# Introspect full command schema
agents-cli schema haystack --json

# Dry-run before executing (safe exploration)
agents-cli run haystack -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe haystack --json
```

## When to Use This Tool

Use `haystack` when:
- Your task involves cli tool: haystack
- A task requires haystack-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what haystack provides
