---
name: vega
version: 0.0.0
description: "CLI tool: vega. Use this skill whenever the user works with vega or tasks related to cli tool: vega — even if they don't mention "vega" by name."
ingredients:
  - vega/vega
tags:
  - cli
---

# vega

CLI tool: vega

## Overview

vega provides cli tool: vega. Agents benefit from vega because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add vega/vega

# Or clone from GitHub
git clone https://github.com/vega/vega.git
```

## Global Options

| Flag | Alias | Description |
|------|-------|-------------|
| `--base` | `-b` | Base directory for data loading. Defaults to the directory |
| `--loglevel` | `-l` | Level of log messages written to stderr. One of "error", |
| `--config` | `-c` | Vega config object. Either a JSON file or a .js file that |
| `--format` | `-f` | Number format locale descriptor. Either a JSON file or a .js |
| `--timeFormat` | `-t` | Date/time format locale descriptor. Either a JSON file or a |
| `--scale` | `-s` | Output resolution scale factor.        [number] [default: 1] |
| `--seed` | — | Seed for random number generation.                  [number] |
| `--test` | — | Disable default PDF metadata for test suites.      [boolean] |
| `--help` | — | Show help                                          [boolean] |
| `--version` | — | Show version number                                [boolean] |

## Help Reference

The following is the tool's built-in help output for reference:

```
Render a Vega specification to PDF.
Usage: vg2pdf [vega_json_spec_file] [output_pdf_file]
If no arguments are provided, reads from stdin.
If output_pdf_file is not provided, writes to stdout.
For errors and log messages, writes to stderr.

To load data, you may need to set a base directory:
For web retrieval, use '-b http://host/data/'.
For files, use '-b file:///dir/data/' (absolute) or '-b data/' (relative).

Options:
  -b, --base        Base directory for data loading. Defaults to the directory
                    of the input spec.                                  [string]
  -l, --loglevel    Level of log messages written to stderr. One of "error",
                    "warn" (default), "info", or "debug".               [string]
  -c, --config      Vega config object. Either a JSON file or a .js file that
                    exports the config object.                          [string]
  -f, --format      Number format locale descriptor. Either a JSON file or a .js
                    file that exports the locale object.                [string]
  -t, --timeFormat  Date/time format locale descriptor. Either a JSON file or a
                    .js file that exports the locale object.            [string]
  -s, --scale       Output resolution scale factor.        [number] [default: 1]
      --seed        Seed for random number generation.                  [number]
      --test        Disable default PDF metadata for test suites.      [boolean]
      --help        Show help                                          [boolean]
      --version     Show version number                                [boolean]
```

## Usage

```bash
# Show help and available options
vega --help

# Check version
vega --version
```

Refer to the project documentation for detailed usage:
- https://github.com/vega/vega

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add vega/vega

# 2. Verify installation
agents-cli run vega -- --version

# 3. Explore capabilities
agents-cli schema vega --json
```

### Piping with other tools

```bash
# Chain vega output with jq for structured processing
agents-cli run vega -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run vega -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run vega -- --help --json

# Introspect full command schema
agents-cli schema vega --json

# Dry-run before executing (safe exploration)
agents-cli run vega -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe vega --json
```

## When to Use This Tool

Use `vega` when:
- Your task involves cli tool: vega
- A task requires vega-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what vega provides
