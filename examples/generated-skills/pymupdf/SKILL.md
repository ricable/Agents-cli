---
name: PyMuPDF
version: 0.0.0
description: "CLI tool: PyMuPDF. Use this skill whenever the user works with PyMuPDF or tasks related to cli tool: pymupdf — even if they don't mention "PyMuPDF" by name."
ingredients:
  - pymupdf/PyMuPDF
tags:
  - cli
---

# PyMuPDF

CLI tool: PyMuPDF

## Overview

PyMuPDF provides cli tool: pymupdf. Agents benefit from PyMuPDF because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add pymupdf/PyMuPDF

# Or clone from GitHub
git clone https://github.com/pymupdf/PyMuPDF.git
```

## Usage

```bash
# Show help and available options
PyMuPDF --help

# Check version
PyMuPDF --version
```

Refer to the project documentation for detailed usage:
- https://github.com/pymupdf/PyMuPDF

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add pymupdf/PyMuPDF

# 2. Verify installation
agents-cli run PyMuPDF -- --version

# 3. Explore capabilities
agents-cli schema PyMuPDF --json
```

### Piping with other tools

```bash
# Chain PyMuPDF output with jq for structured processing
agents-cli run PyMuPDF -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run PyMuPDF -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run PyMuPDF -- --help --json

# Introspect full command schema
agents-cli schema PyMuPDF --json

# Dry-run before executing (safe exploration)
agents-cli run PyMuPDF -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe PyMuPDF --json
```

## When to Use This Tool

Use `PyMuPDF` when:
- Your task involves cli tool: pymupdf
- A task requires PyMuPDF-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what PyMuPDF provides
