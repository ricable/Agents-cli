---
name: elasticsearch
version: 0.0.0
description: "CLI tool: elasticsearch. Use this skill whenever the user works with elasticsearch or tasks related to cli tool: elasticsearch — even if they don't mention "elasticsearch" by name."
ingredients:
  - elastic/elasticsearch
tags:
  - cli
---

# elasticsearch

CLI tool: elasticsearch

## Overview

elasticsearch provides cli tool: elasticsearch. Agents benefit from elasticsearch because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add elastic/elasticsearch

# Or clone from GitHub
git clone https://github.com/elastic/elasticsearch.git
```

## Usage

```bash
# Show help and available options
elasticsearch --help

# Check version
elasticsearch --version
```

Refer to the project documentation for detailed usage:
- https://github.com/elastic/elasticsearch

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add elastic/elasticsearch

# 2. Verify installation
agents-cli run elasticsearch -- --version

# 3. Explore capabilities
agents-cli schema elasticsearch --json
```

### Piping with other tools

```bash
# Chain elasticsearch output with jq for structured processing
agents-cli run elasticsearch -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run elasticsearch -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run elasticsearch -- --help --json

# Introspect full command schema
agents-cli schema elasticsearch --json

# Dry-run before executing (safe exploration)
agents-cli run elasticsearch -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe elasticsearch --json
```

## When to Use This Tool

Use `elasticsearch` when:
- Your task involves cli tool: elasticsearch
- A task requires elasticsearch-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what elasticsearch provides
