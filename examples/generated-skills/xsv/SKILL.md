---
name: xsv
version: 0.0.0
description: "A fast CSV command line toolkit written in Rust.. Use this skill whenever the user works with xsv or tasks related to a fast csv command line toolkit written in rust — even if they don't mention "xsv" by name."
ingredients:
  - BurntSushi/xsv
tags:
  - cli
  - command-line
  - csv
  - rust
# homepage: https://github.com/BurntSushi/xsv
# license: Unlicense
---

# xsv

A fast CSV command line toolkit written in Rust.

**Source**: https://github.com/BurntSushi/xsv

## Overview

xsv provides a fast csv command line toolkit written in rust. Agents benefit from xsv because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add BurntSushi/xsv

# Or clone from GitHub
git clone https://github.com/BurntSushi/xsv.git
```

## Usage

```bash
# Show help and available options
xsv --help

# Check version
xsv --version
```

Refer to the project documentation for detailed usage:
- https://github.com/BurntSushi/xsv

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add BurntSushi/xsv

# 2. Verify installation
agents-cli run xsv -- --version

# 3. Explore capabilities
agents-cli schema xsv --json
```

### Piping with other tools

```bash
# Chain xsv output with jq for structured processing
agents-cli run xsv -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run xsv -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run xsv -- --help --json

# Introspect full command schema
agents-cli schema xsv --json

# Dry-run before executing (safe exploration)
agents-cli run xsv -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe xsv --json
```

## When to Use This Tool

Use `xsv` when:
- Your task involves a fast csv command line toolkit written in rust
- A task requires xsv-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what xsv provides
