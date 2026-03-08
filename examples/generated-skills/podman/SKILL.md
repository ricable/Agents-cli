---
name: podman
version: 0.0.0
description: "CLI tool: podman. Use this skill whenever the user works with podman or tasks related to cli tool: podman — even if they don't mention "podman" by name."
ingredients:
  - containers/podman
tags:
  - cli
---

# podman

CLI tool: podman

## Overview

podman provides cli tool: podman. Agents benefit from podman because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add containers/podman

# Or clone from GitHub
git clone https://github.com/containers/podman.git
```

## Usage

```bash
# Show help and available options
podman --help

# Check version
podman --version
```

Refer to the project documentation for detailed usage:
- https://github.com/containers/podman

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add containers/podman

# 2. Verify installation
agents-cli run podman -- --version

# 3. Explore capabilities
agents-cli schema podman --json
```

### Piping with other tools

```bash
# Chain podman output with jq for structured processing
agents-cli run podman -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run podman -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run podman -- --help --json

# Introspect full command schema
agents-cli schema podman --json

# Dry-run before executing (safe exploration)
agents-cli run podman -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe podman --json
```

## When to Use This Tool

Use `podman` when:
- Your task involves cli tool: podman
- A task requires podman-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what podman provides
