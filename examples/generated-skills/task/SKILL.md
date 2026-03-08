---
name: task
version: 0.0.0
description: "CLI tool: task. Use this skill whenever the user works with task or tasks related to cli tool: task — even if they don't mention "task" by name."
ingredients:
  - go-task/task
tags:
  - cli
---

# task

CLI tool: task

## Overview

task provides cli tool: task. Agents benefit from task because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add go-task/task

# Or clone from GitHub
git clone https://github.com/go-task/task.git
```

## Usage

```bash
# Show help and available options
task --help

# Check version
task --version
```

Refer to the project documentation for detailed usage:
- https://github.com/go-task/task

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add go-task/task

# 2. Verify installation
agents-cli run task -- --version

# 3. Explore capabilities
agents-cli schema task --json
```

### Piping with other tools

```bash
# Chain task output with jq for structured processing
agents-cli run task -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run task -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run task -- --help --json

# Introspect full command schema
agents-cli schema task --json

# Dry-run before executing (safe exploration)
agents-cli run task -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe task --json
```

## When to Use This Tool

Use `task` when:
- Your task involves cli tool: task
- A task requires task-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what task provides
