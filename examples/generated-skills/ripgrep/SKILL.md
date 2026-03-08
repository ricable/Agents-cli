---
name: ripgrep
version: 15.1.0
description: "Fast regex search across files and directories. Use this skill whenever the user needs to search file contents, find patterns in code, grep through a codebase, locate string matches, search logs, or find text across multiple files — even if they say 'grep' or 'search' or 'find in files' instead of 'ripgrep' or 'rg'."
ingredients:
  - BurntSushi/ripgrep
tags:
  - search
  - regex
  - grep
  - cli
  - code-search
---

# ripgrep (rg)

ripgrep recursively searches directories for regex patterns. It is faster than grep, ag, and ack because it uses Rust's regex engine, respects `.gitignore` by default, and skips binary files automatically. Prefer `rg` over `grep` in every situation unless the user explicitly requests GNU grep.

## Core Search Patterns

### Basic literal search

```bash
rg "TODO" src/
```

Search is recursive by default. Omit the path to search the current directory.

### Case-insensitive search

```bash
rg -i "error" logs/
```

Use `-i` for case-insensitive. Use `-S` (smart-case) to be case-insensitive only when the pattern is all lowercase — this is often the best default for interactive use.

```bash
rg -S "error"    # matches Error, ERROR, error
rg -S "Error"    # matches only Error (pattern has uppercase, so exact case)
```

### Regex patterns

rg uses Rust regex syntax (close to PCRE but no backreferences or lookaround).

```bash
# Find function definitions in Python
rg "def \w+\(" --type py

# Find variable assignments
rg "const\s+\w+\s*=" --type ts

# Find IP addresses
rg "\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b"

# Find lines starting with import
rg "^import " --type py
```

### Fixed strings (no regex interpretation)

Use `-F` when the pattern contains regex metacharacters and you want a literal match. This avoids escaping headaches.

```bash
rg -F "map[string]interface{}" --type go
rg -F "$.ajax(" --type js
rg -F "a]b[c" .
```

**Why `-F` matters for agents:** When searching for user-provided strings, always use `-F` unless the user explicitly wants regex. This prevents injection of regex metacharacters.

### Word boundaries

Use `-w` to match whole words only. Prevents `error` from matching `errorHandler`.

```bash
rg -w "error" src/
```

## File Type Filtering

### Built-in type filters (`-t` / `--type`)

rg ships with built-in file type definitions. This is faster and more reliable than glob filtering for known languages.

```bash
rg "useState" -t tsx -t jsx       # React files
rg "SELECT.*FROM" -t sql          # SQL files
rg "func " -t go                  # Go files
rg "class " -t py -t java         # Python and Java
```

List all known types:

```bash
rg --type-list
```

### Negating types (`-T`)

Exclude file types:

```bash
rg "TODO" -T json -T yaml         # Skip config files
rg "import" -T test               # Skip test files
```

### Glob filtering (`-g`)

Use globs for patterns that don't map to a built-in type, or when you need path-level filtering.

```bash
rg "TODO" -g "*.tsx"                    # Only .tsx files
rg "TODO" -g "!*.test.ts"              # Exclude test files
rg "config" -g "*.{yml,yaml,toml}"     # Multiple extensions
rg "migration" -g "db/**"              # Only in db/ directory
rg "secret" -g "!node_modules/**"      # Exclude directory
```

**Multiple globs combine with AND for exclusions, OR for inclusions:**

```bash
rg "pattern" -g "*.ts" -g "!*.test.ts" -g "!*.spec.ts"
```

## Context Control

Show surrounding lines to understand where matches appear.

```bash
# 2 lines before and after each match
rg -C 2 "panic" --type rust

# 5 lines after (useful for function signatures → see the body)
rg -A 5 "^func " --type go

# 3 lines before (useful for seeing comments/decorators above a match)
rg -B 3 "def test_" --type py
```

**Agent tip:** When investigating a bug, use `-C 5` to get enough surrounding code to understand the logic. When just listing occurrences, omit context for cleaner output.

## Output Formats

### Count matches (`-c` / `--count`)

```bash
rg -c "TODO" src/
# src/main.rs:3
# src/lib.rs:7
```

Use `--count-matches` to count individual matches per file (not just lines with matches):

```bash
rg --count-matches "unwrap()" --type rust
```

### Files with matches only (`-l`)

List only filenames, not the matching lines. Fast for discovering which files contain something.

```bash
rg -l "deprecated" src/
# src/old_api.py
# src/legacy.py
```

Inverse — files WITHOUT matches:

```bash
rg --files-without-match "use strict" -g "*.js"
```

### JSON output (`--json`)

Structured output for programmatic consumption. Each line is a JSON object with type `begin`, `match`, `end`, or `summary`.

```bash
rg --json "TODO" src/ | head -20
```

Each match object contains:
- `path.text` — the file path
- `lines.text` — the matching line content
- `line_number` — 1-based line number
- `submatches` — array of `{match.text, start, end}` for each match on the line

**Pipe to jq for extraction:**

```bash
# Get just file:line for each match
rg --json "TODO" src/ | jq -r 'select(.type == "match") | "\(.data.path.text):\(.data.line_number)"'

# Extract match text only
rg --json "fixme|hack" -i src/ | jq -r 'select(.type == "match") | .data.lines.text' | sort -u

# Count matches per file as JSON
rg --json -c "TODO" src/ | jq -r 'select(.type == "summary") | .data.stats'
```

### Line numbers

Line numbers are on by default for terminal output, off when piped. Force them:

```bash
rg -n "pattern" src/     # Force line numbers on
rg -N "pattern" src/     # Force line numbers off
```

### Only matching text (`-o`)

Print only the matched portion, not the full line:

```bash
rg -o "v\d+\.\d+\.\d+" CHANGELOG.md
# v1.2.3
# v1.1.0
# v1.0.0
```

## Advanced Features

### Multiline matching (`-U`)

Match patterns that span multiple lines. Requires `--multiline` or `-U`.

```bash
# Find multi-line function signatures in Go
rg -U "func \w+\([^)]*\n[^)]*\)" --type go

# Find empty try/catch blocks in Java
rg -U "catch\s*\([^)]+\)\s*\{\s*\}" --type java

# Find Python docstrings
rg -U '"""[\s\S]*?"""' --type py
```

**Important:** `-U` enables `.` to NOT match newlines by default. Use `(?s)` flag inside the pattern to make `.` match newlines, or use `[\s\S]` as shown above.

### Search and replace (`-r` / `--replace`)

Preview replacements without modifying files (rg never modifies files):

```bash
# Preview replacing console.log with logger.debug
rg "console\.log" -r "logger.debug" --type ts

# Capture groups in replacements
rg "(\w+)\.forEach\(" -r '$1.map(' --type js

# Remove matched text
rg "// TODO:.*$" -r "" --type ts
```

**To actually apply replacements**, pipe through `sed` or use a dedicated tool:

```bash
rg -l "old_name" --type py | xargs sed -i '' 's/old_name/new_name/g'
```

### Include/exclude hidden and ignored files

By default, rg respects `.gitignore` and skips hidden files. Override this:

```bash
rg "SECRET" --hidden              # Include dotfiles (.env, .config)
rg "pattern" --no-ignore          # Ignore .gitignore rules
rg "pattern" -u                   # Shorthand: --no-ignore
rg "pattern" -uu                  # --no-ignore --hidden
rg "pattern" -uuu                 # --no-ignore --hidden --binary
```

## Performance

### Thread control

rg auto-detects CPU cores. Override for constrained environments:

```bash
rg --threads 4 "pattern" /large/codebase
rg -j 1 "pattern"                 # Single-threaded (deterministic output order)
```

### Memory-mapped I/O

```bash
rg --mmap "pattern" /very/large/file.log
```

Use `--mmap` for single very large files (>1GB). For many small files (typical codebases), the default is already optimal.

### Limit search depth

```bash
rg --max-depth 2 "pattern"        # Only current dir + 1 level of subdirs
```

### Limit output

```bash
rg -m 5 "pattern"                 # Stop after 5 matches per file
rg --max-count 1 "pattern"        # First match per file only (fast existence check)
```

### Binary files

rg skips binary files by default. Force search:

```bash
rg -a "pattern" /path             # Treat binary as text
rg --binary "pattern" /path       # Search binary but suppress binary output
```

## Common Agent Workflows

### Find all TODO/FIXME comments in a project

```bash
rg "(TODO|FIXME|HACK|XXX|WARN)[\s:](.*)" -n --type-not json
```

### Find function/method definitions

```bash
# TypeScript/JavaScript
rg "(function|const|let|var)\s+\w+\s*=" -t ts -t js
rg "^\s*(export\s+)?(async\s+)?function\s+\w+" -t ts

# Python
rg "^\s*def \w+\(" -t py
rg "^\s*class \w+" -t py

# Go
rg "^func\s+" -t go

# Rust
rg "^\s*(pub\s+)?fn\s+\w+" -t rust
```

### Find imports of a specific module

```bash
# JavaScript/TypeScript
rg "from\s+['\"].*react-router" -t ts -t tsx -t js -t jsx
rg "require\(['\"]lodash" -t js

# Python
rg "^(from|import)\s+requests" -t py

# Go
rg '"github\.com/gorilla/mux"' -t go
```

### Find where a function is called (not just defined)

```bash
# Find calls to `processOrder` excluding its definition
rg "processOrder\(" -t ts | rg -v "(function|const|let|var|def|func)\s+processOrder"
```

### Find configuration values

```bash
rg "(DATABASE_URL|DB_HOST|DB_PORT)" -t yaml -t toml -t env --hidden
```

### Find files that import from a directory

```bash
rg "from\s+['\"]\.\.?/utils" -l -t ts
```

### Search git history (combine with git)

```bash
# Search content in all commits
git log -p --all -S "function_name" -- "*.ts"

# Search commit messages
git log --grep="fix.*crash" --oneline
```

### Find dead code candidates

```bash
# Find exported functions, then check if they're imported anywhere
rg -o "export (function|const|class) (\w+)" -r '$2' --no-filename -t ts | sort -u | while read name; do
  count=$(rg -c "\b$name\b" -t ts --no-filename | paste -sd+ | bc)
  [ "$count" -le 1 ] && echo "Possibly unused: $name"
done
```

## Integration Patterns

### Pipe to jq (structured analysis)

```bash
# Group matches by file with counts
rg --json "TODO" src/ | jq -s '[.[] | select(.type=="match")] | group_by(.data.path.text) | map({file: .[0].data.path.text, count: length})'
```

### Combine with fd (find + search)

```bash
# Search only in recently modified files
fd -e ts --changed-within 7d -x rg "TODO" {}

# Search in files matching a complex name pattern
fd ".*\.config\.(ts|js)$" | xargs rg "port"
```

### Use in shell scripts

```bash
# Exit code: 0 = match found, 1 = no match, 2 = error
if rg -q "deprecated" src/; then
  echo "Warning: deprecated patterns found"
fi
```

### Sorted/deterministic output

rg output order is nondeterministic by default (parallel threads). For deterministic results:

```bash
rg --sort path "pattern"          # Sort by file path
rg --sort modified "pattern"      # Sort by modification time
rg -j1 "pattern"                  # Single thread (preserves filesystem order)
```

## Gotchas and Edge Cases

### Regex escaping

Rust regex syntax — no `\d` shorthand in some contexts, but `\d`, `\w`, `\s` do work. Beware:

- **No lookahead/lookbehind:** `(?=...)` and `(?<=...)` are supported via `--engine auto` or `--pcre2` but NOT in default mode. Install with PCRE2 support if needed.
- **Literal dots:** Always escape dots in domain names, file extensions: `rg "foo\.bar\.com"`
- **Curly braces in patterns:** Escape them or use `-F`: `rg "map\[string\]" --type go`

```bash
# If you need lookaround
rg -P "(?<=func\s)\w+" --type go   # -P enables PCRE2
```

### .gitignore behavior

rg reads `.gitignore`, `.rgignore`, and `.ignore` files. This means:

- Files in `node_modules/`, `vendor/`, `.git/` are skipped by default
- If a file isn't showing up in results, check if it's gitignored
- Use `--no-ignore` to override, or `--debug` to see which ignore rules apply

```bash
rg --debug "pattern" 2>&1 | head -30   # See ignore rule decisions
```

### Binary file detection

rg skips files detected as binary. If you know a file is text but rg skips it:

```bash
rg --binary "pattern" suspect_file.dat
rg -a "pattern" suspect_file.dat       # Treat as text regardless
```

### Large single-line files (minified JS, large JSON)

rg reads line by line. A 50MB single-line minified JS file will be one "line":

```bash
rg --max-columns 200 "pattern" bundle.min.js    # Truncate long lines
rg --max-columns 200 --max-columns-preview "pattern" file.json  # Show truncation indicator
```

### No matches found — debugging

```bash
# Check rg is searching where you think
rg --files | head -20                  # List files rg WOULD search
rg --files -t py                       # List Python files rg sees

# Check if pattern is valid
rg --debug "your_pattern" 2>&1 | grep -i error
```

### Encoding

rg assumes UTF-8. For other encodings use `--encoding utf-16` or `--encoding sjis`.
