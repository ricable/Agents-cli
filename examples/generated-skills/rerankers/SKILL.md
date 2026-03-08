---
name: rerankers
version: 0.0.0
description: "CLI tool: rerankers. Use this skill whenever the user works with rerankers or tasks related to cli tool: rerankers — even if they don't mention "rerankers" by name."
ingredients:
  - AnswerDotAI/rerankers
tags:
  - cli
---

# rerankers

CLI tool: rerankers

## Overview

rerankers provides cli tool: rerankers. Agents benefit from rerankers because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add AnswerDotAI/rerankers

# Or clone from GitHub
git clone https://github.com/AnswerDotAI/rerankers.git
```

## Usage

```bash
# Show help and available options
rerankers --help

# Check version
rerankers --version
```

Refer to the project documentation for detailed usage:
- https://github.com/AnswerDotAI/rerankers

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add AnswerDotAI/rerankers

# 2. Verify installation
agents-cli run rerankers -- --version

# 3. Explore capabilities
agents-cli schema rerankers --json
```

### Piping with other tools

```bash
# Chain rerankers output with jq for structured processing
agents-cli run rerankers -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run rerankers -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run rerankers -- --help --json

# Introspect full command schema
agents-cli schema rerankers --json

# Dry-run before executing (safe exploration)
agents-cli run rerankers -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe rerankers --json
```

## When to Use This Tool

Use `rerankers` when:
- Your task involves cli tool: rerankers
- A task requires rerankers-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what rerankers provides
