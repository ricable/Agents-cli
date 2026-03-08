---
name: featureform
version: 0.0.0
description: "CLI tool: featureform. Use this skill whenever the user works with featureform or tasks related to cli tool: featureform — even if they don't mention "featureform" by name."
ingredients:
  - featureform/featureform
tags:
  - cli
---

# featureform

CLI tool: featureform

## Overview

featureform provides cli tool: featureform. Agents benefit from featureform because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add featureform/featureform

# Or clone from GitHub
git clone https://github.com/featureform/featureform.git
```

## Usage

```bash
# Show help and available options
featureform --help

# Check version
featureform --version
```

Refer to the project documentation for detailed usage:
- https://github.com/featureform/featureform

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add featureform/featureform

# 2. Verify installation
agents-cli run featureform -- --version

# 3. Explore capabilities
agents-cli schema featureform --json
```

### Piping with other tools

```bash
# Chain featureform output with jq for structured processing
agents-cli run featureform -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run featureform -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run featureform -- --help --json

# Introspect full command schema
agents-cli schema featureform --json

# Dry-run before executing (safe exploration)
agents-cli run featureform -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe featureform --json
```

## When to Use This Tool

Use `featureform` when:
- Your task involves cli tool: featureform
- A task requires featureform-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what featureform provides
