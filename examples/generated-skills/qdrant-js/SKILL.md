---
name: @qdrant/js-client-rest
version: 1.17.0
description: "This repository contains the REST client for the [Qdrant](https://github.com/qdrant/qdrant) vector search engine.. Use this skill whenever the user works with @qdrant/js-client-rest or tasks related to this repository contains the rest client for the [qdrant](https://github.com/qdrant/qdrant) vector search engine — even if they don't mention "@qdrant/js-client-rest" by name."
ingredients:
  - @qdrant/js-client-rest
tags:
  - cli
# homepage: https://github.com/qdrant/qdrant-js#readme
# license: Apache-2.0
---

# @qdrant/js-client-rest

This repository contains the REST client for the [Qdrant](https://github.com/qdrant/qdrant) vector search engine.

**Source**: https://github.com/qdrant/qdrant-js#readme

## Overview

@qdrant/js-client-rest provides this repository contains the rest client for the [qdrant](https://github.com/qdrant/qdrant) vector search engine. Agents benefit from @qdrant/js-client-rest because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add @qdrant/js-client-rest

# Or install directly via npm
npm install -g @qdrant/js-client-rest
```

## Usage

```bash
# Show help and available options
@qdrant/js-client-rest --help

# Check version
@qdrant/js-client-rest --version
```

Refer to the project documentation for detailed usage:
- https://github.com/qdrant/qdrant-js#readme

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add @qdrant/js-client-rest

# 2. Verify installation
agents-cli run @qdrant/js-client-rest -- --version

# 3. Explore capabilities
agents-cli schema @qdrant/js-client-rest --json
```

### Piping with other tools

```bash
# Chain @qdrant/js-client-rest output with jq for structured processing
agents-cli run @qdrant/js-client-rest -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run @qdrant/js-client-rest -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run @qdrant/js-client-rest -- --help --json

# Introspect full command schema
agents-cli schema @qdrant/js-client-rest --json

# Dry-run before executing (safe exploration)
agents-cli run @qdrant/js-client-rest -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe @qdrant/js-client-rest --json
```

## When to Use This Tool

Use `@qdrant/js-client-rest` when:
- Your task involves this repository contains the rest client for the [qdrant](https://github.com/qdrant/qdrant) vector search engine
- A task requires @qdrant/js-client-rest-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what @qdrant/js-client-rest provides
