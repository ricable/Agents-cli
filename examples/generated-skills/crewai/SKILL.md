---
name: crewAI
version: 0.0.0
description: "CLI tool: crewAI. Use this skill whenever the user works with crewAI or tasks related to cli tool: crewai — even if they don't mention "crewAI" by name."
ingredients:
  - crewAIInc/crewAI
tags:
  - cli
---

# crewAI

CLI tool: crewAI

## Overview

crewAI provides cli tool: crewai. Agents benefit from crewAI because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add crewAIInc/crewAI

# Or clone from GitHub
git clone https://github.com/crewAIInc/crewAI.git
```

## Usage

```bash
# Show help and available options
crewAI --help

# Check version
crewAI --version
```

Refer to the project documentation for detailed usage:
- https://github.com/crewAIInc/crewAI

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add crewAIInc/crewAI

# 2. Verify installation
agents-cli run crewAI -- --version

# 3. Explore capabilities
agents-cli schema crewAI --json
```

### Piping with other tools

```bash
# Chain crewAI output with jq for structured processing
agents-cli run crewAI -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run crewAI -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run crewAI -- --help --json

# Introspect full command schema
agents-cli schema crewAI --json

# Dry-run before executing (safe exploration)
agents-cli run crewAI -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe crewAI --json
```

## When to Use This Tool

Use `crewAI` when:
- Your task involves cli tool: crewai
- A task requires crewAI-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what crewAI provides
