---
name: mmpose
version: 0.0.0
description: "CLI tool: mmpose. Use this skill whenever the user works with mmpose or tasks related to cli tool: mmpose — even if they don't mention "mmpose" by name."
ingredients:
  - open-mmlab/mmpose
tags:
  - cli
---

# mmpose

CLI tool: mmpose

## Overview

mmpose provides cli tool: mmpose. Agents benefit from mmpose because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add open-mmlab/mmpose

# Or clone from GitHub
git clone https://github.com/open-mmlab/mmpose.git
```

## Usage

```bash
# Show help and available options
mmpose --help

# Check version
mmpose --version
```

Refer to the project documentation for detailed usage:
- https://github.com/open-mmlab/mmpose

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add open-mmlab/mmpose

# 2. Verify installation
agents-cli run mmpose -- --version

# 3. Explore capabilities
agents-cli schema mmpose --json
```

### Piping with other tools

```bash
# Chain mmpose output with jq for structured processing
agents-cli run mmpose -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run mmpose -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run mmpose -- --help --json

# Introspect full command schema
agents-cli schema mmpose --json

# Dry-run before executing (safe exploration)
agents-cli run mmpose -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe mmpose --json
```

## When to Use This Tool

Use `mmpose` when:
- Your task involves cli tool: mmpose
- A task requires mmpose-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what mmpose provides
