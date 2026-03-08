---
name: RAGatouille
version: 0.0.0
description: "CLI tool: RAGatouille. Use this skill whenever the user works with RAGatouille or tasks related to cli tool: ragatouille — even if they don't mention "RAGatouille" by name."
ingredients:
  - AnswerDotAI/RAGatouille
tags:
  - cli
---

# RAGatouille

CLI tool: RAGatouille

## Overview

RAGatouille provides cli tool: ragatouille. Agents benefit from RAGatouille because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add AnswerDotAI/RAGatouille

# Or clone from GitHub
git clone https://github.com/AnswerDotAI/RAGatouille.git
```

## Usage

```bash
# Show help and available options
RAGatouille --help

# Check version
RAGatouille --version
```

Refer to the project documentation for detailed usage:
- https://github.com/AnswerDotAI/RAGatouille

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add AnswerDotAI/RAGatouille

# 2. Verify installation
agents-cli run RAGatouille -- --version

# 3. Explore capabilities
agents-cli schema RAGatouille --json
```

### Piping with other tools

```bash
# Chain RAGatouille output with jq for structured processing
agents-cli run RAGatouille -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run RAGatouille -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run RAGatouille -- --help --json

# Introspect full command schema
agents-cli schema RAGatouille --json

# Dry-run before executing (safe exploration)
agents-cli run RAGatouille -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe RAGatouille --json
```

## When to Use This Tool

Use `RAGatouille` when:
- Your task involves cli tool: ragatouille
- A task requires RAGatouille-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what RAGatouille provides
