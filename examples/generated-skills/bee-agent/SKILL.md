---
name: bee-agent-framework
version: 0.0.0
description: "CLI tool: bee-agent-framework. Use this skill whenever the user works with bee-agent-framework or tasks related to cli tool: bee-agent-framework — even if they don't mention "bee-agent-framework" by name."
ingredients:
  - i-am-bee/bee-agent-framework
tags:
  - cli
---

# bee-agent-framework

CLI tool: bee-agent-framework

## Overview

bee-agent-framework provides cli tool: bee-agent-framework. Agents benefit from bee-agent-framework because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add i-am-bee/bee-agent-framework

# Or clone from GitHub
git clone https://github.com/i-am-bee/bee-agent-framework.git
```

## Usage

```bash
# Show help and available options
bee-agent-framework --help

# Check version
bee-agent-framework --version
```

Refer to the project documentation for detailed usage:
- https://github.com/i-am-bee/bee-agent-framework

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add i-am-bee/bee-agent-framework

# 2. Verify installation
agents-cli run bee-agent-framework -- --version

# 3. Explore capabilities
agents-cli schema bee-agent-framework --json
```

### Piping with other tools

```bash
# Chain bee-agent-framework output with jq for structured processing
agents-cli run bee-agent-framework -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run bee-agent-framework -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run bee-agent-framework -- --help --json

# Introspect full command schema
agents-cli schema bee-agent-framework --json

# Dry-run before executing (safe exploration)
agents-cli run bee-agent-framework -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe bee-agent-framework --json
```

## When to Use This Tool

Use `bee-agent-framework` when:
- Your task involves cli tool: bee-agent-framework
- A task requires bee-agent-framework-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what bee-agent-framework provides
