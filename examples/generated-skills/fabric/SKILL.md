---
name: fabric
version: 0.0.0
description: "CLI tool: fabric. Use this skill whenever the user works with fabric or tasks related to cli tool: fabric — even if they don't mention "fabric" by name."
ingredients:
  - danielmiessler/fabric
tags:
  - cli
---

# fabric

CLI tool: fabric

## Overview

fabric provides cli tool: fabric. Agents benefit from fabric because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add danielmiessler/fabric

# Or clone from GitHub
git clone https://github.com/danielmiessler/fabric.git
```

## Usage

```bash
# Show help and available options
fabric --help

# Check version
fabric --version
```

Refer to the project documentation for detailed usage:
- https://github.com/danielmiessler/fabric

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add danielmiessler/fabric

# 2. Verify installation
agents-cli run fabric -- --version

# 3. Explore capabilities
agents-cli schema fabric --json
```

### Piping with other tools

```bash
# Chain fabric output with jq for structured processing
agents-cli run fabric -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run fabric -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run fabric -- --help --json

# Introspect full command schema
agents-cli schema fabric --json

# Dry-run before executing (safe exploration)
agents-cli run fabric -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe fabric --json
```

## When to Use This Tool

Use `fabric` when:
- Your task involves cli tool: fabric
- A task requires fabric-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what fabric provides
