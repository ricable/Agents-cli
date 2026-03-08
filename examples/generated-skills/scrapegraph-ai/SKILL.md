---
name: Scrapegraph-ai
version: 0.0.0
description: "CLI tool: Scrapegraph-ai. Use this skill whenever the user works with Scrapegraph-ai or tasks related to cli tool: scrapegraph-ai — even if they don't mention "Scrapegraph-ai" by name."
ingredients:
  - ScrapeGraphAI/Scrapegraph-ai
tags:
  - cli
---

# Scrapegraph-ai

CLI tool: Scrapegraph-ai

## Overview

Scrapegraph-ai provides cli tool: scrapegraph-ai. Agents benefit from Scrapegraph-ai because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add ScrapeGraphAI/Scrapegraph-ai

# Or clone from GitHub
git clone https://github.com/ScrapeGraphAI/Scrapegraph-ai.git
```

## Usage

```bash
# Show help and available options
Scrapegraph-ai --help

# Check version
Scrapegraph-ai --version
```

Refer to the project documentation for detailed usage:
- https://github.com/ScrapeGraphAI/Scrapegraph-ai

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add ScrapeGraphAI/Scrapegraph-ai

# 2. Verify installation
agents-cli run Scrapegraph-ai -- --version

# 3. Explore capabilities
agents-cli schema Scrapegraph-ai --json
```

### Piping with other tools

```bash
# Chain Scrapegraph-ai output with jq for structured processing
agents-cli run Scrapegraph-ai -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run Scrapegraph-ai -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run Scrapegraph-ai -- --help --json

# Introspect full command schema
agents-cli schema Scrapegraph-ai --json

# Dry-run before executing (safe exploration)
agents-cli run Scrapegraph-ai -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe Scrapegraph-ai --json
```

## When to Use This Tool

Use `Scrapegraph-ai` when:
- Your task involves cli tool: scrapegraph-ai
- A task requires Scrapegraph-ai-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what Scrapegraph-ai provides
