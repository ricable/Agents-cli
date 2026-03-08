---
name: jan
version: 0.0.0
description: "Jan is an open source alternative to ChatGPT that runs 100% offline on your computer.. Use this skill whenever the user works with jan or tasks related to jan is an open source alternative to chatgpt that runs 100% offline on your computer — even if they don't mention "jan" by name."
ingredients:
  - janhq/jan
tags:
  - chatgpt
  - gpt
  - llamacpp
  - llm
  - localai
  - open-source
  - self-hosted
  - tauri
  - cli
# homepage: https://jan.ai/
# license: NOASSERTION
---

# jan

Jan is an open source alternative to ChatGPT that runs 100% offline on your computer.

**Source**: https://jan.ai/

## Overview

jan provides jan is an open source alternative to chatgpt that runs 100% offline on your computer. Agents benefit from jan because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add janhq/jan

# Or clone from GitHub
git clone https://github.com/janhq/jan.git
```

## Usage

```bash
# Show help and available options
jan --help

# Check version
jan --version
```

Refer to the project documentation for detailed usage:
- https://jan.ai/

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add janhq/jan

# 2. Verify installation
agents-cli run jan -- --version

# 3. Explore capabilities
agents-cli schema jan --json
```

### Piping with other tools

```bash
# Chain jan output with jq for structured processing
agents-cli run jan -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run jan -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run jan -- --help --json

# Introspect full command schema
agents-cli schema jan --json

# Dry-run before executing (safe exploration)
agents-cli run jan -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe jan --json
```

## When to Use This Tool

Use `jan` when:
- Your task involves jan is an open source alternative to chatgpt that runs 100% offline on your computer
- A task requires jan-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what jan provides
