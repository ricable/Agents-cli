---
name: @redocly/cli
version: 2.20.4
description: "CLI tool: @redocly/cli. Use this skill whenever the user works with @redocly/cli or tasks related to cli tool: @redocly/cli — even if they don't mention "@redocly/cli" by name."
ingredients:
  - @redocly/cli
tags:
  - cli
---

# @redocly/cli

CLI tool: @redocly/cli

## Overview

@redocly/cli provides cli tool: @redocly/cli. Agents benefit from @redocly/cli because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add @redocly/cli

# Or install directly via npm
npm install -g @redocly/cli
```

## Global Options

| Flag | Alias | Description |
|------|-------|-------------|
| `--version` | — | Show version number.                                      [boolean] |
| `--help` | — | Show help.                                                [boolean] |

## Help Reference

The following is the tool's built-in help output for reference:

```
cli.js <command>

Commands:
  cli.js stats [api]                        Show statistics for an API descripti
                                            on.
  cli.js split [api]                        Split an API description into a mult
                                            i-file structure.
  cli.js join [apis...]                     Join multiple API descriptions into
                                            one [experimental].
  cli.js push [files...]                    Push documents to Reunite.
  cli.js lint [apis...]                     Lint an API or Arazzo description.
  cli.js bundle [apis...]                   Bundle a multi-file API description
                                            to a single file.
  cli.js check-config                       Lint the Redocly configuration file.
  cli.js login                              Log in to Redocly.
  cli.js logout                             Clear your stored credentials.
  cli.js preview                            Preview Redocly project using one of
                                             the product NPM packages.
  cli.js build-docs [api]                   Produce API documentation as an HTML
                                             file
  cli.js translate <locale>                 Creates or updates translations.yaml
                                             files and fills them with missing b
                                            uilt-in translations and translation
                                            s from the redocly.yaml and sidebars
                                            .yaml files.
  cli.js eject <type> [path]                Helper function to eject project ele
                                            ments for customization.
  cli.js respect [files...]                 Run Arazzo tests.
  cli.js generate-arazzo <descriptionPath>  Auto-generate arazzo description fil
                                            e from an API description.
  cli.js scorecard-classic [api]            Run quality scorecards with multiple
                                             rule levels to validate and maintai
                                            n API description standards.
  cli.js completion                         Generate autocomplete script for `re
                                            docly` command.

Options:
  --version  Show version number.                                      [boolean]
  --help     Show help.                                                [boolean]
```

## Usage

```bash
# Show help and available options
@redocly/cli --help

# Check version
@redocly/cli --version
```

Refer to the project documentation for detailed usage:
- https://github.com/@redocly/cli

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add @redocly/cli

# 2. Verify installation
agents-cli run @redocly/cli -- --version

# 3. Explore capabilities
agents-cli schema @redocly/cli --json
```

### Piping with other tools

```bash
# Chain @redocly/cli output with jq for structured processing
agents-cli run @redocly/cli -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run @redocly/cli -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run @redocly/cli -- --help --json

# Introspect full command schema
agents-cli schema @redocly/cli --json

# Dry-run before executing (safe exploration)
agents-cli run @redocly/cli -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe @redocly/cli --json
```

## When to Use This Tool

Use `@redocly/cli` when:
- Your task involves cli tool: @redocly/cli
- A task requires @redocly/cli-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what @redocly/cli provides
