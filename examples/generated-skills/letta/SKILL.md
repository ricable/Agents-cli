---
name: letta
version: 0.0.0
description: "Letta is the platform for building stateful agents: AI with advanced memory that can learn and self-improve over time.. Use this skill whenever the user works with letta or tasks related to letta is the platform for building stateful agents: ai with advanced memory that can learn and self-improve over time — even if they don't mention "letta" by name."
ingredients:
  - letta-ai/letta
tags:
  - ai
  - ai-agents
  - llm
  - llm-agent
  - cli
# homepage: https://docs.letta.com/
# license: Apache-2.0
---

# letta

Letta is the platform for building stateful agents: AI with advanced memory that can learn and self-improve over time.

**Source**: https://docs.letta.com/

## Overview

letta provides letta is the platform for building stateful agents: ai with advanced memory that can learn and self-improve over time. Agents benefit from letta because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add letta-ai/letta

# Or clone from GitHub
git clone https://github.com/letta-ai/letta.git
```

## Usage

```bash
# Show help and available options
letta --help

# Check version
letta --version
```

Refer to the project documentation for detailed usage:
- https://docs.letta.com/

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add letta-ai/letta

# 2. Verify installation
agents-cli run letta -- --version

# 3. Explore capabilities
agents-cli schema letta --json
```

### Piping with other tools

```bash
# Chain letta output with jq for structured processing
agents-cli run letta -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run letta -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run letta -- --help --json

# Introspect full command schema
agents-cli schema letta --json

# Dry-run before executing (safe exploration)
agents-cli run letta -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe letta --json
```

## When to Use This Tool

Use `letta` when:
- Your task involves letta is the platform for building stateful agents: ai with advanced memory that can learn and self-improve over time
- A task requires letta-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what letta provides
