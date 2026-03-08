---
name: bat
version: 0.26.1
description: "File viewer with syntax highlighting and git integration. Use this skill whenever the user needs to view file contents with syntax highlighting, display code with line numbers, preview files, or show file diffs — even if they say 'cat' or 'show file' or 'view code'."
ingredients:
  - sharkdp/bat
tags:
  - viewer
  - syntax-highlighting
  - cli
  - cat
  - preview
---

# bat

A `cat` clone with wings: syntax highlighting, git integration, line numbers, and smart paging out of the box. Drop-in replacement for `cat` in every context where readability matters.

**Source**: https://github.com/sharkdp/bat

---

## Basic Viewing

View any file with automatic syntax detection, line numbers, and decorations:

```bash
# View a single file
bat src/main.rs

# View multiple files (concatenated with headers)
bat src/main.rs src/lib.rs Cargo.toml

# Read from stdin (use -l to hint the language)
curl -s https://example.com/config.yaml | bat -l yaml

# Pipe another command's output through bat
docker logs mycontainer 2>&1 | bat -l log

# Explicitly read from stdin with a filename for detection
cat /dev/urandom | head -c 100 | bat -A
```

When no file is given, bat reads from stdin. This makes it a universal pretty-printer for any pipeline.

---

## Syntax Highlighting

bat ships with grammars for 200+ languages. Detection is automatic by file extension and shebang, but you can override it:

```bash
# Force a language when extension is missing or wrong
bat -l python script_without_extension
bat --language=json data.txt

# Show all supported languages
bat --list-languages

# Filter the language list
bat --list-languages | grep -i ruby

# Highlight a heredoc or config snippet from stdin
echo '{"key": "value"}' | bat -l json

# Map an extension to a language (persistent via config)
echo '--map-syntax "*.conf:INI"' >> "$(bat --config-file)"
```

**Language aliases**: `js` = JavaScript, `ts` = TypeScript, `py` = Python, `rb` = Ruby, `rs` = Rust, `yml` = YAML, `md` = Markdown.

---

## Line Ranges

Show specific line ranges instead of the full file. Invaluable for reviewing functions, error contexts, or log windows:

```bash
# Lines 10 through 25
bat -r 10:25 src/app.py
bat --line-range 10:25 src/app.py

# From line 100 to end of file
bat -r 100: server.log

# First 20 lines only
bat -r :20 README.md

# Multiple ranges (disjoint sections)
bat -r 1:5 -r 50:60 -r 200:210 main.go

# Highlight specific lines (adds visual emphasis)
bat --highlight-line 42 src/bug.rs
bat --highlight-line 10:15 --highlight-line 30 main.py

# Combine range + highlight: show lines 30-50 with line 42 emphasized
bat -r 30:50 --highlight-line 42 src/handler.ts
```

---

## Display Options

Control decorations, chrome, and output style:

```bash
# Plain output — no line numbers, no grid, no header (like cat but with highlighting)
bat -p file.py
bat --plain file.py

# Double plain — no highlighting either (truly equivalent to cat)
bat -pp file.py

# Full decorations (default)
bat --style=full file.py

# Pick specific decorations
bat --style=numbers file.py            # Line numbers only
bat --style=changes file.py            # Git diff markers only
bat --style=header,numbers file.py     # Header + line numbers
bat --style=grid,numbers file.py       # Grid lines + line numbers
bat --style=plain file.py              # Same as -p

# Show line numbers (on by default, but explicit for scripts)
bat -n file.py
bat --number file.py

# Available style components:
#   full, auto, plain, changes, header, header-filename,
#   header-filesize, grid, rule, numbers, snip
```

### Style component reference

| Component         | Shows                                      |
|-------------------|--------------------------------------------|
| `header`          | Filename and language                      |
| `header-filename` | Filename only                              |
| `header-filesize` | File size only                             |
| `grid`            | Border lines around content                |
| `rule`            | Horizontal rule between files              |
| `numbers`         | Line numbers in the gutter                 |
| `changes`         | Git modification markers in the gutter     |
| `snip`            | Section break markers for line ranges      |
| `full`            | All components enabled                     |
| `auto`            | Sensible defaults for the terminal context |
| `plain`           | No decorations at all                      |

---

## Git Integration

bat automatically shows git modification markers in the gutter when viewing files inside a git repository:

```bash
# View a file — modified/added/deleted lines marked in the gutter
bat src/app.ts
#  ~  = modified line
#  +  = added line
#  -  = deleted line (marker on the line below)

# Show only git change markers (hide all other decorations)
bat --style=changes src/app.ts

# Combine with diff for a richer view
git diff HEAD~1 -- src/app.ts | bat -l diff

# View staged changes with highlighting
git diff --staged | bat -l diff

# Show a specific commit's changes
git show HEAD | bat -l diff

# Compare two files with diff, highlighted by bat
diff -u old.conf new.conf | bat -l diff
```

The git markers work automatically — no configuration needed. They reflect the diff between the working tree and the HEAD commit.

---

## Paging

bat pipes output through a pager (default: `less`) for files that exceed the terminal height:

```bash
# Disable paging (useful for piping output downstream)
bat --paging=never file.py

# Always page, even for short files
bat --paging=always file.py

# Auto-page: page if output exceeds terminal, otherwise print directly (default)
bat --paging=auto file.py

# Use a custom pager
bat --pager="less -RFX" file.py
bat --pager="more" file.py

# Disable paging via environment variable
export BAT_PAGER=""
bat file.py  # no paging

# Use delta as the pager (popular for git diffs)
bat --pager="delta" file.py
```

**Tip**: When bat detects its output is being piped (not a terminal), it automatically disables paging and decorations. This means `bat file.py | grep pattern` just works.

---

## Themes

bat supports full TextMate/Sublime themes for syntax coloring:

```bash
# Use a specific theme for this invocation
bat --theme="Dracula" file.py
bat --theme="Monokai Extended" file.py
bat --theme="Solarized (dark)" file.py
bat --theme="ansi" file.py

# List all available themes
bat --list-themes

# Preview all themes against a file
bat --list-themes | while read -r theme; do
  echo "--- $theme ---"
  bat --theme="$theme" --style=numbers file.py
done

# Set a default theme via environment variable
export BAT_THEME="TwoDark"

# Popular themes:
#   Dracula, Monokai Extended, Monokai Extended Light,
#   Nord, OneHalfDark, OneHalfLight, Solarized (dark),
#   Solarized (light), TwoDark, ansi, base16, gruvbox-dark,
#   gruvbox-light, zenburn

# Use "ansi" theme to respect your terminal's color scheme
bat --theme="ansi" file.py

# Add custom themes
mkdir -p "$(bat --config-dir)/themes"
cp MyTheme.tmTheme "$(bat --config-dir)/themes/"
bat cache --build
```

---

## Output Control

Control color output and non-printable character display:

```bash
# Force color even when piping (useful for tools that strip color)
bat --color=always file.py | head -20

# Disable color entirely
bat --color=never file.py

# Auto-detect (color for terminal, plain for pipe — default)
bat --color=auto file.py

# Show non-printable characters (tabs, spaces, newlines, unicode)
bat -A file.txt
bat --show-all file.txt

# Show non-printable characters with a specific tab width
bat -A --tabs 4 file.txt

# Combine for debugging whitespace issues
bat -A --style=numbers file.py

# Set tab width (default: 4)
bat --tabs 8 Makefile
bat --tabs 2 file.yaml

# Wrap long lines (default: character wrap to terminal width)
bat --wrap=never file.py    # No wrapping, horizontal scroll in pager
bat --wrap=character file.py # Wrap at character boundary
bat --wrap=auto file.py     # Smart wrapping (default)

# Force a specific terminal width (useful in CI)
bat --terminal-width 120 file.py
```

---

## Configuration

bat supports a persistent configuration file:

```bash
# Show the config file path
bat --config-file
# Typically: ~/.config/bat/config

# Show the config directory
bat --config-dir

# Example config file content:
# --theme="TwoDark"
# --style="numbers,changes,header"
# --map-syntax "*.ino:C++"
# --map-syntax ".ignore:Git Ignore"
# --pager="less -RFX"
# --tabs 4

# Rebuild the cache after adding themes or syntaxes
bat cache --build

# Clear the cache
bat cache --clear
```

---

## Integration with Other Tools

bat shines as a component in larger workflows:

### fzf previewer

```bash
# File finder with bat preview
fzf --preview 'bat --color=always --style=numbers --line-range=:500 {}'

# Git-tracked file finder with bat preview
git ls-files | fzf --preview 'bat --color=always --style=numbers {}'

# Grep results with context preview
rg --line-number "pattern" | fzf --delimiter=: \
  --preview 'bat --color=always --highlight-line {2} --line-range {2}: {1}'

# Function: fuzzy-find and open with bat preview
fbat() {
  local file
  file=$(fzf --preview 'bat --color=always --style=numbers {}') && bat "$file"
}
```

### Pager for other tools

```bash
# Use bat as the man page viewer
export MANPAGER="sh -c 'col -bx | bat -l man -p'"

# Use bat as the default pager for help output
alias bathelp='bat --plain --language=help'
help2man ls | bat -l man

# Use bat as git's pager for diff
git config --global core.pager "bat --style=numbers --color=always"

# Use bat with ripgrep for highlighted results
rg --json "pattern" | bat -l json

# Pretty-print a JSON API response
curl -s https://api.github.com/repos/sharkdp/bat | bat -l json

# View Markdown rendered with headers
bat --style=header,grid README.md
```

### Concatenation and comparison

```bash
# Concatenate files with headers separating each
bat --style=header,rule src/*.py

# Side-by-side comparison (with diff + bat)
diff -u file1.py file2.py | bat -l diff

# View all config files in a directory
bat --style=header,numbers /etc/nginx/conf.d/*.conf

# Create a syntax-highlighted code dump
bat --color=always --style=plain src/**/*.ts > highlighted_dump.txt
```

---

## Agent Workflows

Common patterns for AI agents and automation scripts:

### View file with syntax highlighting

```bash
# Standard file view — the default agent action for "show me the file"
bat --paging=never --style=numbers,header src/main.py

# Pipe-safe version (always outputs color for downstream processing)
bat --paging=never --color=always --style=numbers src/main.py
```

### Show specific lines

```bash
# View a function or block (lines 45-72)
bat --paging=never -r 45:72 --style=numbers src/handler.ts

# View with emphasis on a specific line
bat --paging=never -r 35:55 --highlight-line 42 --style=numbers src/bug.rs

# View error context: 5 lines around line 100
bat --paging=never -r 95:105 --highlight-line 100 --style=numbers app.py
```

### Preview and inspect code

```bash
# Quick file type detection
bat --style=header-filename file_without_extension

# Count lines with syntax-aware display
bat --style=numbers file.py | tail -1

# View with all metadata (size, language, git status)
bat --style=full file.py

# Plain output for piping into other tools (preserves highlighting)
bat -p --color=always file.py | grep "def "

# Silent language detection check
bat --list-languages | grep -qi "python" && echo "Python supported"
```

### CI/CD and scripting

```bash
# Non-interactive, always-color output for CI logs
bat --paging=never --color=always --style=numbers,changes --terminal-width=120 src/

# Batch preview: show first 10 lines of all source files
for f in src/*.py; do
  bat --paging=never --style=header -r :10 "$f"
done
```

---

## Quick Reference

| Task                          | Command                                              |
|-------------------------------|------------------------------------------------------|
| View file                     | `bat file.py`                                        |
| View without decorations      | `bat -p file.py`                                     |
| View specific lines           | `bat -r 10:20 file.py`                               |
| Highlight a line              | `bat --highlight-line 42 file.py`                    |
| Force language                | `bat -l json data.txt`                               |
| Change theme                  | `bat --theme=Dracula file.py`                        |
| No paging                     | `bat --paging=never file.py`                         |
| Show non-printable chars      | `bat -A file.txt`                                    |
| Force color in pipe           | `bat --color=always file.py \| ...`                  |
| fzf preview                   | `fzf --preview 'bat --color=always {}'`              |
| View git diff                 | `git diff \| bat -l diff`                            |
| List themes                   | `bat --list-themes`                                  |
| List languages                | `bat --list-languages`                               |
| Use as man pager              | `MANPAGER="sh -c 'col -bx \| bat -l man -p'" man ls`|

---

## Key Flags Reference

| Flag                    | Short | Description                                       |
|-------------------------|-------|---------------------------------------------------|
| `--language`            | `-l`  | Force syntax language                             |
| `--line-range`          | `-r`  | Show only lines N:M                               |
| `--highlight-line`      |       | Visually emphasize specific lines                 |
| `--plain`               | `-p`  | No decorations (use twice for no color)           |
| `--style`               |       | Comma-separated decoration components             |
| `--theme`               |       | Set color theme                                   |
| `--paging`              |       | `never`, `always`, or `auto`                      |
| `--pager`               |       | Custom pager command                              |
| `--color`               |       | `always`, `never`, or `auto`                      |
| `--show-all`            | `-A`  | Show non-printable characters                     |
| `--tabs`                |       | Set tab width (default: 4)                        |
| `--wrap`                |       | Line wrapping: `auto`, `never`, `character`       |
| `--terminal-width`      |       | Override detected terminal width                  |
| `--number`              | `-n`  | Show line numbers only (shorthand for `--style=numbers`) |
| `--list-languages`      |       | Print all supported languages                     |
| `--list-themes`         |       | Print all available themes                        |
| `--map-syntax`          |       | Map file pattern to language (e.g., `"*.conf:INI"`) |
| `--config-file`         |       | Print config file path                            |
| `--config-dir`          |       | Print config directory path                       |

---

## Environment Variables

| Variable     | Purpose                                | Example                  |
|--------------|----------------------------------------|--------------------------|
| `BAT_THEME`  | Default theme                          | `export BAT_THEME=Dracula` |
| `BAT_STYLE`  | Default style                          | `export BAT_STYLE=numbers` |
| `BAT_PAGER`  | Default pager (overrides `--pager`)    | `export BAT_PAGER=less`   |
| `BAT_CONFIG_PATH` | Custom config file location       | `export BAT_CONFIG_PATH=~/.bat.conf` |
| `NO_COLOR`   | Disable color output (spec: no-color.org) | `export NO_COLOR=1`    |
