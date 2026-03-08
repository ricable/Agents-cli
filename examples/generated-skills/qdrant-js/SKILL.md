---
name: @qdrant/js-client-rest
version: 1.17.0
description: "This repository contains the REST client for the [Qdrant](https://github.com/qdrant/qdrant) vector search engine.. Use this skill when working with @qdrant/js-client-rest-related tasks."
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

## Usage

```bash
# Show help
@qdrant/js-client-rest --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run @qdrant/js-client-rest -- --help --json

# Introspect command schema
agents-cli schema @qdrant/js-client-rest --json

# Dry-run before executing
agents-cli run @qdrant/js-client-rest -- <args> --dry-run
```
