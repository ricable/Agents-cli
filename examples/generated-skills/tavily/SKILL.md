---
name: @tavily/core
version: 0.7.2
description: "Official JavaScript library for Tavily.. Use this skill when working with @tavily/core-related tasks."
ingredients:
  - @tavily/core
tags:
  - search
  - crawl
  - extract
  - agent
  - ai
  - tavily
  - cli
# homepage: https://tavily.com
# license: MIT
---

# @tavily/core

Official JavaScript library for Tavily.

**Source**: https://tavily.com

## Usage

```bash
# Show help
@tavily/core --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run @tavily/core -- --help --json

# Introspect command schema
agents-cli schema @tavily/core --json

# Dry-run before executing
agents-cli run @tavily/core -- <args> --dry-run
```
