---
name: SWE-agent
version: 0.0.0
description: "CLI tool: SWE-agent. Use this skill whenever the user works with SWE-agent or tasks related to cli tool: swe-agent — even if they don't mention "SWE-agent" by name."
ingredients:
  - princeton-nlp/SWE-agent
tags:
  - cli
---

# SWE-agent

CLI tool: SWE-agent

## Overview

SWE-agent provides cli tool: swe-agent. Agents benefit from SWE-agent because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add princeton-nlp/SWE-agent

# Or clone from GitHub
git clone https://github.com/princeton-nlp/SWE-agent.git
```

## Usage

```bash
# Show help and available options
SWE-agent --help

# Check version
SWE-agent --version
```

Refer to the project documentation for detailed usage:
- https://github.com/princeton-nlp/SWE-agent

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add princeton-nlp/SWE-agent

# 2. Verify installation
agents-cli run SWE-agent -- --version

# 3. Explore capabilities
agents-cli schema SWE-agent --json
```

### Piping with other tools

```bash
# Chain SWE-agent output with jq for structured processing
agents-cli run SWE-agent -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run SWE-agent -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run SWE-agent -- --help --json

# Introspect full command schema
agents-cli schema SWE-agent --json

# Dry-run before executing (safe exploration)
agents-cli run SWE-agent -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe SWE-agent --json
```

## When to Use This Tool

Use `SWE-agent` when:
- Your task involves cli tool: swe-agent
- A task requires SWE-agent-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what SWE-agent provides
