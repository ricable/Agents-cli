---
name: tabby
version: 0.0.0
description: "Self-hosted AI coding assistant. Use this skill whenever the user works with tabby or tasks related to self-hosted ai coding assistant — even if they don't mention "tabby" by name."
ingredients:
  - TabbyML/tabby
tags:
  - ai
  - codegen
  - coding-assistant
  - coding-language
  - developer-experience
  - developer-tools
  - gen-ai
  - ide
  - llms
  - cli
# homepage: https://tabbyml.com
# license: NOASSERTION
---

# tabby

Self-hosted AI coding assistant

**Source**: https://tabbyml.com

## Overview

tabby provides self-hosted ai coding assistant. Agents benefit from tabby because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add TabbyML/tabby

# Or clone from GitHub
git clone https://github.com/TabbyML/tabby.git
```

## Usage

```bash
# Show help and available options
tabby --help

# Check version
tabby --version
```

Refer to the project documentation for detailed usage:
- https://tabbyml.com

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add TabbyML/tabby

# 2. Verify installation
agents-cli run tabby -- --version

# 3. Explore capabilities
agents-cli schema tabby --json
```

### Piping with other tools

```bash
# Chain tabby output with jq for structured processing
agents-cli run tabby -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run tabby -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run tabby -- --help --json

# Introspect full command schema
agents-cli schema tabby --json

# Dry-run before executing (safe exploration)
agents-cli run tabby -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe tabby --json
```

## When to Use This Tool

Use `tabby` when:
- Your task involves self-hosted ai coding assistant
- A task requires tabby-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what tabby provides
