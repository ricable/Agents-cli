---
name: gh-copilot
version: 0.0.0
description: "CLI tool: gh-copilot. Use this skill whenever the user works with gh-copilot or tasks related to cli tool: gh-copilot — even if they don't mention "gh-copilot" by name."
ingredients:
  - github/gh-copilot
tags:
  - cli
---

# gh-copilot

CLI tool: gh-copilot

## Overview

gh-copilot provides cli tool: gh-copilot. Agents benefit from gh-copilot because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add github/gh-copilot

# Or clone from GitHub
git clone https://github.com/github/gh-copilot.git
```

## Usage

```bash
# Show help and available options
gh-copilot --help

# Check version
gh-copilot --version
```

Refer to the project documentation for detailed usage:
- https://github.com/github/gh-copilot

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add github/gh-copilot

# 2. Verify installation
agents-cli run gh-copilot -- --version

# 3. Explore capabilities
agents-cli schema gh-copilot --json
```

### Piping with other tools

```bash
# Chain gh-copilot output with jq for structured processing
agents-cli run gh-copilot -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run gh-copilot -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run gh-copilot -- --help --json

# Introspect full command schema
agents-cli schema gh-copilot --json

# Dry-run before executing (safe exploration)
agents-cli run gh-copilot -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe gh-copilot --json
```

## When to Use This Tool

Use `gh-copilot` when:
- Your task involves cli tool: gh-copilot
- A task requires gh-copilot-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what gh-copilot provides
