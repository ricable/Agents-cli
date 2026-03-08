---
name: @apidevtools/swagger-cli
version: 4.0.4
description: "Swagger 2.0 and OpenAPI 3.0 command-line tool. Use this skill when the user needs @apidevtools/swagger-cli (commands: validate, bundle), even if they don't mention "@apidevtools/swagger-cli" explicitly."
ingredients:
  - @apidevtools/swagger-cli
tags:
  - swagger
  - openapi
  - open-api
  - cli
  - rest
  - api
  - yaml
  - parse
  - parser
  - validate
  - validator
  - validation
  - host
# homepage: https://apitools.dev/swagger-cli/
# license: MIT
---

# @apidevtools/swagger-cli

Swagger 2.0 and OpenAPI 3.0 command-line tool

**Source**: https://apitools.dev/swagger-cli/

## Commands

### `@apidevtools/swagger-cli validate`

Validates an API definition in Swagger 2.0 or OpenAPI 3.0 format

**Flags:**
- `--no-schema` — Do NOT validate against the Swagger/OpenAPI JSON schema

### `@apidevtools/swagger-cli bundle`

Bundles a multi-file API definition into a single file

**Flags:**
- `--outfile` (-o) — The output file

## Global Options

| Flag | Alias | Description |
|------|-------|-------------|
| `--help` | `-h` | Show help for any command |
| `--version` | `-v` | Output the CLI version number |
| `--debug` | `-d` | Show debug output |

## Usage

```bash
# Show help
@apidevtools/swagger-cli --help

# Validates an API definition in Swagger 2.0 or OpenAPI 3.0 format
@apidevtools/swagger-cli validate

# Bundles a multi-file API definition into a single file
@apidevtools/swagger-cli bundle

```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run @apidevtools/swagger-cli -- --help --json

# Introspect command schema
agents-cli schema @apidevtools/swagger-cli --json

# Dry-run before executing
agents-cli run @apidevtools/swagger-cli -- <args> --dry-run
```
