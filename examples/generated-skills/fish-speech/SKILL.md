---
name: fish-speech
version: 0.0.0
description: "CLI tool: fish-speech. Use this skill whenever the user works with fish-speech or tasks related to cli tool: fish-speech — even if they don't mention "fish-speech" by name."
ingredients:
  - fishaudio/fish-speech
tags:
  - cli
---

# fish-speech

CLI tool: fish-speech

## Overview

fish-speech provides cli tool: fish-speech. Agents benefit from fish-speech because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add fishaudio/fish-speech

# Or clone from GitHub
git clone https://github.com/fishaudio/fish-speech.git
```

## Usage

```bash
# Show help and available options
fish-speech --help

# Check version
fish-speech --version
```

Refer to the project documentation for detailed usage:
- https://github.com/fishaudio/fish-speech

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add fishaudio/fish-speech

# 2. Verify installation
agents-cli run fish-speech -- --version

# 3. Explore capabilities
agents-cli schema fish-speech --json
```

### Piping with other tools

```bash
# Chain fish-speech output with jq for structured processing
agents-cli run fish-speech -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run fish-speech -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run fish-speech -- --help --json

# Introspect full command schema
agents-cli schema fish-speech --json

# Dry-run before executing (safe exploration)
agents-cli run fish-speech -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe fish-speech --json
```

## When to Use This Tool

Use `fish-speech` when:
- Your task involves cli tool: fish-speech
- A task requires fish-speech-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what fish-speech provides
