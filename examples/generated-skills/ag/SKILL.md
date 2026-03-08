---
name: the_silver_searcher
version: 0.0.0
description: "A code-searching tool similar to ack, but faster.. Use this skill whenever the user works with the_silver_searcher or tasks related to a code-searching tool similar to ack, but faster — even if they don't mention "the_silver_searcher" by name."
ingredients:
  - ggreer/the_silver_searcher
tags:
  - ag
  - c
  - command-line-tool
  - pcre
  - search-in-text
  - silver-searcher
  - cli
# homepage: http://geoff.greer.fm/ag/
# license: Apache-2.0
---

# the_silver_searcher

A code-searching tool similar to ack, but faster.

**Source**: http://geoff.greer.fm/ag/

## Overview

the_silver_searcher provides a code-searching tool similar to ack, but faster. Agents benefit from the_silver_searcher because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add ggreer/the_silver_searcher

# Or clone from GitHub
git clone https://github.com/ggreer/the_silver_searcher.git
```

## Usage

```bash
# Show help and available options
the_silver_searcher --help

# Check version
the_silver_searcher --version
```

Refer to the project documentation for detailed usage:
- http://geoff.greer.fm/ag/

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add ggreer/the_silver_searcher

# 2. Verify installation
agents-cli run the_silver_searcher -- --version

# 3. Explore capabilities
agents-cli schema the_silver_searcher --json
```

### Piping with other tools

```bash
# Chain the_silver_searcher output with jq for structured processing
agents-cli run the_silver_searcher -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run the_silver_searcher -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run the_silver_searcher -- --help --json

# Introspect full command schema
agents-cli schema the_silver_searcher --json

# Dry-run before executing (safe exploration)
agents-cli run the_silver_searcher -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe the_silver_searcher --json
```

## When to Use This Tool

Use `the_silver_searcher` when:
- Your task involves a code-searching tool similar to ack, but faster
- A task requires the_silver_searcher-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what the_silver_searcher provides
