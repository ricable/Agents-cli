---
name: spring-ai
version: 0.0.0
description: "CLI tool: spring-ai. Use this skill when working with spring-ai-related tasks."
ingredients:
  - spring-projects/spring-ai
tags:
  - cli
---

# spring-ai

CLI tool: spring-ai

## Usage

```bash
# Show help
spring-ai --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run spring-ai -- --help --json

# Introspect command schema
agents-cli schema spring-ai --json

# Dry-run before executing
agents-cli run spring-ai -- <args> --dry-run
```
