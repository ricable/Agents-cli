---
name: mmdetection
version: 0.0.0
description: "CLI tool: mmdetection. Use this skill whenever the user works with mmdetection or tasks related to cli tool: mmdetection — even if they don't mention "mmdetection" by name."
ingredients:
  - open-mmlab/mmdetection
tags:
  - cli
---

# mmdetection

CLI tool: mmdetection

## Overview

mmdetection provides cli tool: mmdetection. Agents benefit from mmdetection because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add open-mmlab/mmdetection

# Or clone from GitHub
git clone https://github.com/open-mmlab/mmdetection.git
```

## Usage

```bash
# Show help and available options
mmdetection --help

# Check version
mmdetection --version
```

Refer to the project documentation for detailed usage:
- https://github.com/open-mmlab/mmdetection

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add open-mmlab/mmdetection

# 2. Verify installation
agents-cli run mmdetection -- --version

# 3. Explore capabilities
agents-cli schema mmdetection --json
```

### Piping with other tools

```bash
# Chain mmdetection output with jq for structured processing
agents-cli run mmdetection -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run mmdetection -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run mmdetection -- --help --json

# Introspect full command schema
agents-cli schema mmdetection --json

# Dry-run before executing (safe exploration)
agents-cli run mmdetection -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe mmdetection --json
```

## When to Use This Tool

Use `mmdetection` when:
- Your task involves cli tool: mmdetection
- A task requires mmdetection-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what mmdetection provides
