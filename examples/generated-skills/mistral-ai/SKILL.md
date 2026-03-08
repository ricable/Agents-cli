---
name: @mistralai/mistralai
version: 1.14.1
description: "<!-- Start Summary [summary] --> ## Summary. Use this skill when working with @mistralai/mistralai-related tasks."
ingredients:
  - @mistralai/mistralai
tags:
  - cli
# homepage: https://github.com/mistralai/client-ts#readme
---

# @mistralai/mistralai

<!-- Start Summary [summary] --> ## Summary

**Source**: https://github.com/mistralai/client-ts#readme

## Usage

```bash
# Show help
@mistralai/mistralai --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run @mistralai/mistralai -- --help --json

# Introspect command schema
agents-cli schema @mistralai/mistralai --json

# Dry-run before executing
agents-cli run @mistralai/mistralai -- <args> --dry-run
```
