---
name: spacy-models
version: 0.0.0
description: "💫  Models for the spaCy Natural Language Processing (NLP) library. Use this skill whenever the user works with spacy-models or tasks related to 💫  models for the spacy natural language processing (nlp) library — even if they don't mention "spacy-models" by name."
ingredients:
  - explosion/spacy-models
tags:
  - machine-learning
  - machine-learning-models
  - models
  - natural-language-processing
  - nlp
  - spacy
  - spacy-models
  - statistical-models
  - cli
# homepage: https://spacy.io
---

# spacy-models

💫  Models for the spaCy Natural Language Processing (NLP) library

**Source**: https://spacy.io

## Overview

spacy-models provides 💫  models for the spacy natural language processing (nlp) library. Agents benefit from spacy-models because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add explosion/spacy-models

# Or clone from GitHub
git clone https://github.com/explosion/spacy-models.git
```

## Usage

```bash
# Show help and available options
spacy-models --help

# Check version
spacy-models --version
```

Refer to the project documentation for detailed usage:
- https://spacy.io

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add explosion/spacy-models

# 2. Verify installation
agents-cli run spacy-models -- --version

# 3. Explore capabilities
agents-cli schema spacy-models --json
```

### Piping with other tools

```bash
# Chain spacy-models output with jq for structured processing
agents-cli run spacy-models -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run spacy-models -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run spacy-models -- --help --json

# Introspect full command schema
agents-cli schema spacy-models --json

# Dry-run before executing (safe exploration)
agents-cli run spacy-models -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe spacy-models --json
```

## When to Use This Tool

Use `spacy-models` when:
- Your task involves 💫  models for the spacy natural language processing (nlp) library
- A task requires spacy-models-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what spacy-models provides
