---
name: neo4j-graphrag-python
version: 0.0.0
description: "CLI tool: neo4j-graphrag-python. Use this skill whenever the user works with neo4j-graphrag-python or tasks related to cli tool: neo4j-graphrag-python — even if they don't mention "neo4j-graphrag-python" by name."
ingredients:
  - neo4j/neo4j-graphrag-python
tags:
  - cli
---

# neo4j-graphrag-python

CLI tool: neo4j-graphrag-python

## Overview

neo4j-graphrag-python provides cli tool: neo4j-graphrag-python. Agents benefit from neo4j-graphrag-python because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add neo4j/neo4j-graphrag-python

# Or clone from GitHub
git clone https://github.com/neo4j/neo4j-graphrag-python.git
```

## Usage

```bash
# Show help and available options
neo4j-graphrag-python --help

# Check version
neo4j-graphrag-python --version
```

Refer to the project documentation for detailed usage:
- https://github.com/neo4j/neo4j-graphrag-python

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add neo4j/neo4j-graphrag-python

# 2. Verify installation
agents-cli run neo4j-graphrag-python -- --version

# 3. Explore capabilities
agents-cli schema neo4j-graphrag-python --json
```

### Piping with other tools

```bash
# Chain neo4j-graphrag-python output with jq for structured processing
agents-cli run neo4j-graphrag-python -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run neo4j-graphrag-python -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run neo4j-graphrag-python -- --help --json

# Introspect full command schema
agents-cli schema neo4j-graphrag-python --json

# Dry-run before executing (safe exploration)
agents-cli run neo4j-graphrag-python -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe neo4j-graphrag-python --json
```

## When to Use This Tool

Use `neo4j-graphrag-python` when:
- Your task involves cli tool: neo4j-graphrag-python
- A task requires neo4j-graphrag-python-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what neo4j-graphrag-python provides
