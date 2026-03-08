---
name: braintrust-sdk
version: 0.0.1
description: "CLI tool: braintrust-sdk. Use this skill whenever the user works with braintrust-sdk or tasks related to cli tool: braintrust-sdk — even if they don't mention "braintrust-sdk" by name."
ingredients:
  - braintrustdata/braintrust-sdk
tags:
  - cli
---

# braintrust-sdk

CLI tool: braintrust-sdk

## Overview

braintrust-sdk provides cli tool: braintrust-sdk. Agents benefit from braintrust-sdk because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add braintrustdata/braintrust-sdk

# Or clone from GitHub
git clone https://github.com/braintrustdata/braintrust-sdk.git
```

## Help Reference

The following is the tool's built-in help output for reference:

```
usage: cli.js [-h] [-v] {eval,push,pull} ...

Braintrust CLI

positional arguments:
  {eval,push,pull}
    eval            Run evals locally.
    push            Bundle prompts, tools, scorers, and other resources into
                    Braintrust
    pull            Pull prompts, tools, scorers, and other resources from
                    Braintrust to save in your codebase.

optional arguments:
  -h, --help        show this help message and exit
  -v, --version     show program's version number and exit
```

## Usage

```bash
# Show help and available options
braintrust-sdk --help

# Check version
braintrust-sdk --version
```

Refer to the project documentation for detailed usage:
- https://github.com/braintrustdata/braintrust-sdk

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add braintrustdata/braintrust-sdk

# 2. Verify installation
agents-cli run braintrust-sdk -- --version

# 3. Explore capabilities
agents-cli schema braintrust-sdk --json
```

### Piping with other tools

```bash
# Chain braintrust-sdk output with jq for structured processing
agents-cli run braintrust-sdk -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run braintrust-sdk -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run braintrust-sdk -- --help --json

# Introspect full command schema
agents-cli schema braintrust-sdk --json

# Dry-run before executing (safe exploration)
agents-cli run braintrust-sdk -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe braintrust-sdk --json
```

## When to Use This Tool

Use `braintrust-sdk` when:
- Your task involves cli tool: braintrust-sdk
- A task requires braintrust-sdk-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what braintrust-sdk provides
