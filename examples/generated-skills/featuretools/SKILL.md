---
name: featuretools
version: 0.0.0
description: "CLI tool: featuretools. Use this skill whenever the user works with featuretools or tasks related to cli tool: featuretools — even if they don't mention "featuretools" by name."
ingredients:
  - alteryx/featuretools
tags:
  - cli
---

# featuretools

CLI tool: featuretools

## Overview

featuretools provides cli tool: featuretools. Agents benefit from featuretools because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add alteryx/featuretools

# Or clone from GitHub
git clone https://github.com/alteryx/featuretools.git
```

## Usage

```bash
# Show help and available options
featuretools --help

# Check version
featuretools --version
```

Refer to the project documentation for detailed usage:
- https://github.com/alteryx/featuretools

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add alteryx/featuretools

# 2. Verify installation
agents-cli run featuretools -- --version

# 3. Explore capabilities
agents-cli schema featuretools --json
```

### Piping with other tools

```bash
# Chain featuretools output with jq for structured processing
agents-cli run featuretools -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run featuretools -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run featuretools -- --help --json

# Introspect full command schema
agents-cli schema featuretools --json

# Dry-run before executing (safe exploration)
agents-cli run featuretools -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe featuretools --json
```

## When to Use This Tool

Use `featuretools` when:
- Your task involves cli tool: featuretools
- A task requires featuretools-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what featuretools provides
