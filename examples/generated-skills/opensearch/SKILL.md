---
name: OpenSearch
version: 0.0.0
description: "CLI tool: OpenSearch. Use this skill whenever the user works with OpenSearch or tasks related to cli tool: opensearch — even if they don't mention "OpenSearch" by name."
ingredients:
  - opensearch-project/OpenSearch
tags:
  - cli
---

# OpenSearch

CLI tool: OpenSearch

## Overview

OpenSearch provides cli tool: opensearch. Agents benefit from OpenSearch because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add opensearch-project/OpenSearch

# Or clone from GitHub
git clone https://github.com/opensearch-project/OpenSearch.git
```

## Usage

```bash
# Show help and available options
OpenSearch --help

# Check version
OpenSearch --version
```

Refer to the project documentation for detailed usage:
- https://github.com/opensearch-project/OpenSearch

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add opensearch-project/OpenSearch

# 2. Verify installation
agents-cli run OpenSearch -- --version

# 3. Explore capabilities
agents-cli schema OpenSearch --json
```

### Piping with other tools

```bash
# Chain OpenSearch output with jq for structured processing
agents-cli run OpenSearch -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run OpenSearch -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run OpenSearch -- --help --json

# Introspect full command schema
agents-cli schema OpenSearch --json

# Dry-run before executing (safe exploration)
agents-cli run OpenSearch -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe OpenSearch --json
```

## When to Use This Tool

Use `OpenSearch` when:
- Your task involves cli tool: opensearch
- A task requires OpenSearch-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what OpenSearch provides
