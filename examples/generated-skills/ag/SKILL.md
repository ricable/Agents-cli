---
name: the_silver_searcher
version: 0.0.0
description: "A code-searching tool similar to ack, but faster.. Use this skill when working with the_silver_searcher-related tasks."
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

## Usage

```bash
# Show help
the_silver_searcher --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run the_silver_searcher -- --help --json

# Introspect command schema
agents-cli schema the_silver_searcher --json

# Dry-run before executing
agents-cli run the_silver_searcher -- <args> --dry-run
```
