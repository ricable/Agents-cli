---
name: agency-swarm
version: 1.8.0
description: "CLI tool: agency-swarm. Use this skill whenever the user works with agency-swarm or tasks related to cli tool: agency-swarm — even if they don't mention "agency-swarm" by name."
ingredients:
  - VRSEN/agency-swarm
tags:
  - cli
---

# agency-swarm

CLI tool: agency-swarm

## Overview

agency-swarm provides cli tool: agency-swarm. Agents benefit from agency-swarm because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add VRSEN/agency-swarm

# Or clone from GitHub
git clone https://github.com/VRSEN/agency-swarm.git
```

## Usage

```bash
# Show help and available options
agency-swarm --help

# Check version
agency-swarm --version
```

Refer to the project documentation for detailed usage:
- https://github.com/VRSEN/agency-swarm

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add VRSEN/agency-swarm

# 2. Verify installation
agents-cli run agency-swarm -- --version

# 3. Explore capabilities
agents-cli schema agency-swarm --json
```

### Piping with other tools

```bash
# Chain agency-swarm output with jq for structured processing
agents-cli run agency-swarm -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run agency-swarm -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run agency-swarm -- --help --json

# Introspect full command schema
agents-cli schema agency-swarm --json

# Dry-run before executing (safe exploration)
agents-cli run agency-swarm -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe agency-swarm --json
```

## When to Use This Tool

Use `agency-swarm` when:
- Your task involves cli tool: agency-swarm
- A task requires agency-swarm-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what agency-swarm provides
