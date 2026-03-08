---
name: csvkit
version: 0.0.0
description: "A suite of utilities for converting to and working with CSV, the king of tabular file formats.. Use this skill whenever the user works with csvkit or tasks related to a suite of utilities for converting to and working with csv, the king of tabular file formats — even if they don't mention "csvkit" by name."
ingredients:
  - wireservice/csvkit
tags:
  - cli
# homepage: https://csvkit.readthedocs.io
# license: MIT
---

# csvkit

A suite of utilities for converting to and working with CSV, the king of tabular file formats.

**Source**: https://csvkit.readthedocs.io

## Overview

csvkit provides a suite of utilities for converting to and working with csv, the king of tabular file formats. Agents benefit from csvkit because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add wireservice/csvkit

# Or clone from GitHub
git clone https://github.com/wireservice/csvkit.git
```

## Usage

```bash
# Show help and available options
csvkit --help

# Check version
csvkit --version
```

Refer to the project documentation for detailed usage:
- https://csvkit.readthedocs.io

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add wireservice/csvkit

# 2. Verify installation
agents-cli run csvkit -- --version

# 3. Explore capabilities
agents-cli schema csvkit --json
```

### Piping with other tools

```bash
# Chain csvkit output with jq for structured processing
agents-cli run csvkit -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run csvkit -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run csvkit -- --help --json

# Introspect full command schema
agents-cli schema csvkit --json

# Dry-run before executing (safe exploration)
agents-cli run csvkit -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe csvkit --json
```

## When to Use This Tool

Use `csvkit` when:
- Your task involves a suite of utilities for converting to and working with csv, the king of tabular file formats
- A task requires csvkit-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what csvkit provides
