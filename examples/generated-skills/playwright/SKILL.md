---
name: @playwright/test
version: 1.58.2
description: "CLI tool: @playwright/test. Use this skill whenever the user works with @playwright/test or tasks related to cli tool: @playwright/test — even if they don't mention "@playwright/test" by name."
ingredients:
  - @playwright/test
tags:
  - cli
---

# @playwright/test

CLI tool: @playwright/test

## Overview

@playwright/test provides cli tool: @playwright/test. Agents benefit from @playwright/test because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add @playwright/test

# Or install directly via npm
npm install -g @playwright/test
```

## Global Options

| Flag | Alias | Description |
|------|-------|-------------|
| `--version` | `-V` | output the version number |
| `--help` | `-h` | display help for command |

## Help Reference

The following is the tool's built-in help output for reference:

```
Usage: npx playwright [options] [command]

Options:
  -V, --version                          output the version number
  -h, --help                             display help for command

Commands:
  open [options] [url]                   open page in browser specified via -b, --browser
  codegen [options] [url]                open page and generate code for user actions
  install [options] [browser...]         ensure browsers necessary for this version of Playwright are installed
  uninstall [options]                    Removes browsers used by this installation of Playwright from the system (chromium, firefox, webkit, ffmpeg). This does not include branded channels.
  install-deps [options] [browser...]    install dependencies necessary to run browsers (will ask for sudo permissions)
  cr [options] [url]                     open page in Chromium
  ff [options] [url]                     open page in Firefox
  wk [options] [url]                     open page in WebKit
  screenshot [options] <url> <filename>  capture a page screenshot
  pdf [options] <url> <filename>         save page as pdf
  show-trace [options] [trace]           show trace viewer
  test [options] [test-filter...]        run tests with Playwright Test
  show-report [options] [report]         show HTML report
  merge-reports [options] [dir]          merge multiple blob reports (for sharded tests) into a single report
  clear-cache [options]                  clears build and test caches
  init-agents [options]                  Initialize repository agents
  help [command]                         display help for command
```

## Usage

```bash
# Show help and available options
@playwright/test --help

# Check version
@playwright/test --version
```

Refer to the project documentation for detailed usage:
- https://github.com/@playwright/test

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add @playwright/test

# 2. Verify installation
agents-cli run @playwright/test -- --version

# 3. Explore capabilities
agents-cli schema @playwright/test --json
```

### Piping with other tools

```bash
# Chain @playwright/test output with jq for structured processing
agents-cli run @playwright/test -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run @playwright/test -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run @playwright/test -- --help --json

# Introspect full command schema
agents-cli schema @playwright/test --json

# Dry-run before executing (safe exploration)
agents-cli run @playwright/test -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe @playwright/test --json
```

## When to Use This Tool

Use `@playwright/test` when:
- Your task involves cli tool: @playwright/test
- A task requires @playwright/test-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what @playwright/test provides
