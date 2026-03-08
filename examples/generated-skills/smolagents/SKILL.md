---
name: smolagents
version: 0.0.0
description: "CLI tool: smolagents. Use this skill whenever the user works with smolagents or tasks related to cli tool: smolagents — even if they don't mention "smolagents" by name."
ingredients:
  - huggingface/smolagents
tags:
  - cli
---

# smolagents

CLI tool: smolagents

## Overview

smolagents provides cli tool: smolagents. Agents benefit from smolagents because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add huggingface/smolagents

# Or clone from GitHub
git clone https://github.com/huggingface/smolagents.git
```

## Usage

```bash
# Show help and available options
smolagents --help

# Check version
smolagents --version
```

Refer to the project documentation for detailed usage:
- https://github.com/huggingface/smolagents

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add huggingface/smolagents

# 2. Verify installation
agents-cli run smolagents -- --version

# 3. Explore capabilities
agents-cli schema smolagents --json
```

### Piping with other tools

```bash
# Chain smolagents output with jq for structured processing
agents-cli run smolagents -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run smolagents -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run smolagents -- --help --json

# Introspect full command schema
agents-cli schema smolagents --json

# Dry-run before executing (safe exploration)
agents-cli run smolagents -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe smolagents --json
```

## When to Use This Tool

Use `smolagents` when:
- Your task involves cli tool: smolagents
- A task requires smolagents-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what smolagents provides
