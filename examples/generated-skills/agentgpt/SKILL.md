---
name: AgentGPT
version: 0.0.0
description: "CLI tool: AgentGPT. Use this skill whenever the user works with AgentGPT or tasks related to cli tool: agentgpt — even if they don't mention "AgentGPT" by name."
ingredients:
  - reworkd/AgentGPT
tags:
  - cli
---

# AgentGPT

CLI tool: AgentGPT

## Overview

AgentGPT provides cli tool: agentgpt. Agents benefit from AgentGPT because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add reworkd/AgentGPT

# Or clone from GitHub
git clone https://github.com/reworkd/AgentGPT.git
```

## Usage

```bash
# Show help and available options
AgentGPT --help

# Check version
AgentGPT --version
```

Refer to the project documentation for detailed usage:
- https://github.com/reworkd/AgentGPT

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add reworkd/AgentGPT

# 2. Verify installation
agents-cli run AgentGPT -- --version

# 3. Explore capabilities
agents-cli schema AgentGPT --json
```

### Piping with other tools

```bash
# Chain AgentGPT output with jq for structured processing
agents-cli run AgentGPT -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run AgentGPT -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run AgentGPT -- --help --json

# Introspect full command schema
agents-cli schema AgentGPT --json

# Dry-run before executing (safe exploration)
agents-cli run AgentGPT -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe AgentGPT --json
```

## When to Use This Tool

Use `AgentGPT` when:
- Your task involves cli tool: agentgpt
- A task requires AgentGPT-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what AgentGPT provides
