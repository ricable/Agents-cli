---
name: tabbyAPI
version: 0.0.0
description: "The official API server for Exllama. OAI compatible, lightweight, and fast.. Use this skill whenever the user works with tabbyAPI or tasks related to the official api server for exllama. oai compatible, lightweight, and fast — even if they don't mention "tabbyAPI" by name."
ingredients:
  - theroyallab/tabbyAPI
tags:
  - cli
# homepage: https://github.com/theroyallab/tabbyAPI
# license: AGPL-3.0
---

# tabbyAPI

The official API server for Exllama. OAI compatible, lightweight, and fast.

**Source**: https://github.com/theroyallab/tabbyAPI

## Overview

tabbyAPI provides the official api server for exllama. oai compatible, lightweight, and fast. Agents benefit from tabbyAPI because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add theroyallab/tabbyAPI

# Or clone from GitHub
git clone https://github.com/theroyallab/tabbyAPI.git
```

## Usage

```bash
# Show help and available options
tabbyAPI --help

# Check version
tabbyAPI --version
```

Refer to the project documentation for detailed usage:
- https://github.com/theroyallab/tabbyAPI

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add theroyallab/tabbyAPI

# 2. Verify installation
agents-cli run tabbyAPI -- --version

# 3. Explore capabilities
agents-cli schema tabbyAPI --json
```

### Piping with other tools

```bash
# Chain tabbyAPI output with jq for structured processing
agents-cli run tabbyAPI -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run tabbyAPI -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run tabbyAPI -- --help --json

# Introspect full command schema
agents-cli schema tabbyAPI --json

# Dry-run before executing (safe exploration)
agents-cli run tabbyAPI -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe tabbyAPI --json
```

## When to Use This Tool

Use `tabbyAPI` when:
- Your task involves the official api server for exllama. oai compatible, lightweight, and fast
- A task requires tabbyAPI-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what tabbyAPI provides
