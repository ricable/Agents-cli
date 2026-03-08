---
name: TaskWeaver
version: 0.0.0
description: "CLI tool: TaskWeaver. Use this skill whenever the user works with TaskWeaver or tasks related to cli tool: taskweaver — even if they don't mention "TaskWeaver" by name."
ingredients:
  - microsoft/TaskWeaver
tags:
  - cli
---

# TaskWeaver

CLI tool: TaskWeaver

## Overview

TaskWeaver provides cli tool: taskweaver. Agents benefit from TaskWeaver because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add microsoft/TaskWeaver

# Or clone from GitHub
git clone https://github.com/microsoft/TaskWeaver.git
```

## Usage

```bash
# Show help and available options
TaskWeaver --help

# Check version
TaskWeaver --version
```

Refer to the project documentation for detailed usage:
- https://github.com/microsoft/TaskWeaver

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add microsoft/TaskWeaver

# 2. Verify installation
agents-cli run TaskWeaver -- --version

# 3. Explore capabilities
agents-cli schema TaskWeaver --json
```

### Piping with other tools

```bash
# Chain TaskWeaver output with jq for structured processing
agents-cli run TaskWeaver -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run TaskWeaver -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run TaskWeaver -- --help --json

# Introspect full command schema
agents-cli schema TaskWeaver --json

# Dry-run before executing (safe exploration)
agents-cli run TaskWeaver -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe TaskWeaver --json
```

## When to Use This Tool

Use `TaskWeaver` when:
- Your task involves cli tool: taskweaver
- A task requires TaskWeaver-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what TaskWeaver provides
