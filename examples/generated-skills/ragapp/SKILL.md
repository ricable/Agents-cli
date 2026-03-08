---
name: ragapp
version: 0.1.5
description: "CLI tool: ragapp. Use this skill whenever the user works with ragapp or tasks related to cli tool: ragapp — even if they don't mention "ragapp" by name."
ingredients:
  - ragapp/ragapp
tags:
  - cli
---

# ragapp

CLI tool: ragapp

## Overview

ragapp provides cli tool: ragapp. Agents benefit from ragapp because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add ragapp/ragapp

# Or clone from GitHub
git clone https://github.com/ragapp/ragapp.git
```

## Usage

```bash
# Show help and available options
ragapp --help

# Check version
ragapp --version
```

Refer to the project documentation for detailed usage:
- https://github.com/ragapp/ragapp

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add ragapp/ragapp

# 2. Verify installation
agents-cli run ragapp -- --version

# 3. Explore capabilities
agents-cli schema ragapp --json
```

### Piping with other tools

```bash
# Chain ragapp output with jq for structured processing
agents-cli run ragapp -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run ragapp -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run ragapp -- --help --json

# Introspect full command schema
agents-cli schema ragapp --json

# Dry-run before executing (safe exploration)
agents-cli run ragapp -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe ragapp --json
```

## When to Use This Tool

Use `ragapp` when:
- Your task involves cli tool: ragapp
- A task requires ragapp-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what ragapp provides
