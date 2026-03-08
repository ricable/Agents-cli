---
name: SuperAGI
version: 0.0.0
description: "CLI tool: SuperAGI. Use this skill whenever the user works with SuperAGI or tasks related to cli tool: superagi — even if they don't mention "SuperAGI" by name."
ingredients:
  - TransformerOptimus/SuperAGI
tags:
  - cli
---

# SuperAGI

CLI tool: SuperAGI

## Overview

SuperAGI provides cli tool: superagi. Agents benefit from SuperAGI because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add TransformerOptimus/SuperAGI

# Or clone from GitHub
git clone https://github.com/TransformerOptimus/SuperAGI.git
```

## Usage

```bash
# Show help and available options
SuperAGI --help

# Check version
SuperAGI --version
```

Refer to the project documentation for detailed usage:
- https://github.com/TransformerOptimus/SuperAGI

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add TransformerOptimus/SuperAGI

# 2. Verify installation
agents-cli run SuperAGI -- --version

# 3. Explore capabilities
agents-cli schema SuperAGI --json
```

### Piping with other tools

```bash
# Chain SuperAGI output with jq for structured processing
agents-cli run SuperAGI -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run SuperAGI -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run SuperAGI -- --help --json

# Introspect full command schema
agents-cli schema SuperAGI --json

# Dry-run before executing (safe exploration)
agents-cli run SuperAGI -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe SuperAGI --json
```

## When to Use This Tool

Use `SuperAGI` when:
- Your task involves cli tool: superagi
- A task requires SuperAGI-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what SuperAGI provides
