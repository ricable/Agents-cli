---
name: helm
version: 0.0.0
description: "CLI tool: helm. Use this skill whenever the user works with helm or tasks related to cli tool: helm — even if they don't mention "helm" by name."
ingredients:
  - helm/helm
tags:
  - cli
---

# helm

CLI tool: helm

## Overview

helm provides cli tool: helm. Agents benefit from helm because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add helm/helm

# Or clone from GitHub
git clone https://github.com/helm/helm.git
```

## Usage

```bash
# Show help and available options
helm --help

# Check version
helm --version
```

Refer to the project documentation for detailed usage:
- https://github.com/helm/helm

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add helm/helm

# 2. Verify installation
agents-cli run helm -- --version

# 3. Explore capabilities
agents-cli schema helm --json
```

### Piping with other tools

```bash
# Chain helm output with jq for structured processing
agents-cli run helm -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run helm -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run helm -- --help --json

# Introspect full command schema
agents-cli schema helm --json

# Dry-run before executing (safe exploration)
agents-cli run helm -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe helm --json
```

## When to Use This Tool

Use `helm` when:
- Your task involves cli tool: helm
- A task requires helm-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what helm provides
