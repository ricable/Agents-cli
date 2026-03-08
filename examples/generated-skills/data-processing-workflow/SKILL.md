---
name: data-processing-workflow
version: 1.0.0
description: "Data processing and transformation workflow using jq for JSON, rg for text extraction, and fd for file discovery. Use this skill whenever the user needs to process JSON data, transform API responses, extract data from files, convert between formats, aggregate data, or build data pipelines — even if they just say 'parse this JSON' or 'extract the names' or 'convert to CSV' or 'process API response'."
ingredients:
  - jqlang/jq
  - BurntSushi/ripgrep
  - sharkdp/fd
tags:
  - workflow
  - data-processing
  - json
  - transformation
  - etl
---

# Data Processing & Transformation Workflow

Process, transform, and analyze structured and unstructured data using jq, rg, and fd as composable pipeline stages. This workflow turns raw API responses, log files, and scattered JSON into clean, actionable output.

## Prerequisites

Verify all three tools are available before starting any pipeline:

```bash
jq --version    # JSON processor (1.7+)
rg --version    # ripgrep for fast text search
fd --version    # fd for file discovery
```

If any tool is missing, install via the `agents-cli install` command or your system package manager.

---

## Workflow 1: Process API Responses

Use this whenever you fetch data from an API and need to extract, reshape, or filter the response. Most APIs return deeply nested JSON that is unusable without transformation.

### Extract fields from GitHub API

Pull repository names, stars, and language from a GitHub user's repos:

```bash
curl -s "https://api.github.com/users/astral-sh/repos?per_page=100" \
  | jq '[.[] | {name: .name, stars: .stargazers_count, lang: .language}]
        | sort_by(-.stars)'
```

### Reshape npm registry responses

Get dependency count and latest version from an npm package:

```bash
curl -s "https://registry.npmjs.org/express/latest" \
  | jq '{
      name: .name,
      version: .version,
      deps: (.dependencies | keys | length),
      dep_list: (.dependencies | keys)
    }'
```

### Handle paginated APIs

Fetch multiple pages and merge results into a single array:

```bash
for page in 1 2 3; do
  curl -s "https://api.example.com/items?page=$page"
done | jq -s '[.[].data[]]'
```

### Extract error details from API failures

When debugging API issues, pull status codes and error messages:

```bash
curl -s -w '\n{"http_code": %{http_code}}' "https://api.example.com/endpoint" \
  | jq -s '{response: .[0], status: .[1].http_code}'
```

---

## Workflow 2: Transform JSON Structures

Use this when JSON shape does not match what you need -- renaming keys, flattening nesting, merging arrays, or filtering by conditions.

### Flatten nested objects

Turn `{user: {name: "x", address: {city: "y"}}}` into a flat record:

```bash
jq '{
  user_name: .user.name,
  city: .user.address.city,
  zip: .user.address.zip
}' input.json
```

### Rename keys across an array

Rename fields to match a target schema:

```bash
jq '[.[] | {
  id: .identifier,
  full_name: (.first_name + " " + .last_name),
  active: (.status == "enabled")
}]' users.json
```

### Merge two arrays by a shared key

Combine user data with order data using INDEX and join:

```bash
jq -n --slurpfile users users.json --slurpfile orders orders.json '
  ($users[0] | INDEX(.[]; .id)) as $user_map |
  [$orders[0][] | . + {user: $user_map[.user_id | tostring]}]
'
```

### Filter by conditions

Select only active premium users created this year:

```bash
jq '[.[] | select(.active == true and .plan == "premium" and (.created_at | startswith("2026")))]' users.json
```

### Add computed fields

Enrich records with derived values:

```bash
jq '[.[] | . + {
  total: (.price * .quantity),
  discounted: (.price * .quantity * (1 - .discount)),
  label: "\(.name) (x\(.quantity))"
}]' line_items.json
```

---

## Workflow 3: JSON to CSV/TSV Conversion

Use this whenever you need tabular output for spreadsheets, databases, or downstream tools that expect CSV.

### Basic CSV export with headers

```bash
echo "name,email,role"
jq -r '.[] | [.name, .email, .role] | @csv' users.json
```

### Handle nested data in CSV

Flatten before converting -- extract nested fields inline:

```bash
jq -r '.[] | [
  .id,
  .user.name,
  .user.email,
  (.tags | join(";"))
] | @csv' records.json
```

### Handle null values gracefully

Replace nulls with empty strings to avoid broken CSV:

```bash
jq -r '.[] | [
  (.name // ""),
  (.email // "N/A"),
  (.score // 0 | tostring)
] | @csv' data.json
```

### TSV output (for pasting into spreadsheets)

```bash
jq -r '.[] | [.name, .count, .status] | @tsv' data.json
```

### CSV to JSON (reverse direction)

Parse CSV back into JSON objects using column headers:

```bash
head -1 data.csv | tr ',' '\n' > /tmp/headers.txt
tail -n +2 data.csv | while IFS=',' read -r col1 col2 col3; do
  jq -n --arg a "$col1" --arg b "$col2" --arg c "$col3" \
    '{name: $a, email: $b, role: $c}'
done | jq -s '.'
```

---

## Workflow 4: Aggregate and Summarize

Use this to build reports, dashboards, or summary statistics from raw data.

### Group by field and count

```bash
jq 'group_by(.status) | map({
  status: .[0].status,
  count: length
}) | sort_by(-.count)' tasks.json
```

### Compute min, max, average

```bash
jq '{
  count: length,
  total: (map(.amount) | add),
  average: (map(.amount) | add / length),
  min: (map(.amount) | min),
  max: (map(.amount) | max)
}' transactions.json
```

### Group by category and sum values

```bash
jq 'group_by(.category) | map({
  category: .[0].category,
  total_revenue: (map(.price * .quantity) | add),
  order_count: length,
  avg_order: (map(.price * .quantity) | add / length)
})' orders.json
```

### Top N items

Get the 10 most expensive items:

```bash
jq '[sort_by(-.price) | limit(10; .[])]' products.json
```

### Cross-tabulation (pivot)

Count items by two dimensions:

```bash
jq 'group_by(.region) | map({
  region: .[0].region,
  by_status: (group_by(.status) | map({
    status: .[0].status,
    count: length
  }))
})' data.json
```

---

## Workflow 5: Multi-File JSON Processing

Use this when data is spread across many files and you need to discover, process, or merge them.

### Find and process all JSON files

Extract a specific field from every JSON file in a directory tree:

```bash
fd -e json | xargs -I{} jq '{file: input_filename, value: .version}' {}
```

### Merge multiple JSON files into one array

```bash
jq -s '.' file1.json file2.json file3.json
```

Or dynamically with fd:

```bash
fd -e json -x cat {} | jq -s '.'
```

### Process JSON files matching a pattern

Find config files and extract database settings:

```bash
fd -g '*config*.json' | while read -r f; do
  echo "=== $f ==="
  jq '.database // empty' "$f"
done
```

### Batch transform files in place

Add a `processed_at` timestamp to every JSON file:

```bash
fd -e json -x sh -c '
  jq ". + {processed_at: \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" "$1" > "$1.tmp" && mv "$1.tmp" "$1"
' _ {}
```

### Compare fields across files

Find all JSON files where version does not match a target:

```bash
fd -e json -x jq --arg target "2.0.0" \
  'select(.version != $target) | {file: input_filename, version: .version}' {}
```

---

## Workflow 6: Log Analysis

Use this to parse, filter, and structure log data. Combine rg for fast filtering with jq for structuring.

### Parse structured log lines

Extract error entries from a log and structure them:

```bash
rg 'ERROR' app.log \
  | jq -R 'split(" ") | {
      timestamp: .[0:2] | join(" "),
      level: .[2],
      message: .[3:] | join(" ")
    }'
```

### Count errors by type

```bash
rg 'ERROR' app.log \
  | jq -R 'split(" ") | .[3]' \
  | sort | uniq -c | sort -rn
```

### Parse JSON log lines (structured logging)

Many apps emit one JSON object per log line:

```bash
rg --no-filename 'level.*error' logs/ \
  | jq -s '[.[] | {
      time: .timestamp,
      msg: .message,
      trace: .stack_trace[0:200]
    }] | sort_by(.time) | reverse'
```

### Time-range filtering

Extract logs from a specific time window:

```bash
rg '2026-03-08T1[4-6]:' app.log \
  | jq -R -s 'split("\n") | map(select(length > 0)) | {
      count: length,
      first: .[0],
      last: .[-1]
    }'
```

### Error frequency over time

Group errors by hour to spot patterns:

```bash
rg 'ERROR' app.log \
  | jq -R 'split(" ") | .[0][:13]' \
  | sort | uniq -c \
  | jq -R -s 'split("\n") | map(select(length > 0))
    | map(ltrimstr(" ") | split(" ") | {count: .[0] | tonumber, hour: .[1]})'
```

---

## Workflow 7: Configuration Management

Use this to read, update, merge, and validate configuration files programmatically.

### Read a specific config value

```bash
jq -r '.database.host' config.json
```

### Update a config value without clobbering the file

```bash
jq '.database.host = "new-host.example.com" | .database.port = 5433' config.json > config.tmp \
  && mv config.tmp config.json
```

### Merge environment-specific overrides

Layer a base config with environment overrides (env config wins):

```bash
jq -s '.[0] * .[1]' config.base.json config.production.json > config.final.json
```

### Deep merge with array concatenation

When you need arrays merged instead of replaced:

```bash
jq -s '
  def deepmerge(a; b):
    a as $a | b as $b |
    if ($a | type) == "object" and ($b | type) == "object"
    then reduce ($b | keys[]) as $k ($a; .[$k] = deepmerge($a[$k]; $b[$k]))
    elif ($a | type) == "array" and ($b | type) == "array"
    then $a + $b
    else $b
    end;
  deepmerge(.[0]; .[1])
' base.json overrides.json
```

### Generate config from environment variables

```bash
jq -n --arg host "$DB_HOST" --arg port "$DB_PORT" --arg name "$DB_NAME" '{
  database: {host: $host, port: ($port | tonumber), name: $name}
}'
```

---

## Workflow 8: Data Validation

Use this to check data quality -- find missing fields, invalid types, duplicates, and anomalies.

### Find records with missing required fields

```bash
jq '[.[] | select(.email == null or .name == "" or .id == null)]
    | if length > 0
      then {valid: false, missing_count: length, samples: .[0:5]}
      else {valid: true}
      end' data.json
```

### Detect duplicate IDs

```bash
jq 'group_by(.id) | map(select(length > 1))
    | map({id: .[0].id, count: length})' data.json
```

### Validate email format (basic)

```bash
jq '[.[] | select(.email | test("^[^@]+@[^@]+\\.[^@]+$") | not)]
    | {invalid_emails: length, samples: .[0:5]}' users.json
```

### Type checking

Verify fields have expected types:

```bash
jq '[.[] | {
  id: (.id | type),
  name: (.name | type),
  score: (.score | type)
}] | group_by(.) | map({types: .[0], count: length})' data.json
```

### Anomaly detection (values outside expected range)

```bash
jq '(map(.amount) | add / length) as $avg |
    (map((.amount - $avg) * (.amount - $avg)) | add / length | sqrt) as $std |
    [.[] | select(.amount > ($avg + 3 * $std) or .amount < ($avg - 3 * $std))]
    | {outliers: length, items: .}' transactions.json
```

### Schema summary (discover what your data looks like)

```bash
jq '.[0] | [paths(scalars)] | map(join("."))' data.json
```

---

## Workflow 9: Structured Search Results

Use this to turn rg search results into structured, processable data.

### Parse ripgrep JSON output

rg's `--json` flag emits structured output -- pipe it to jq for clean results:

```bash
rg --json 'TODO|FIXME|HACK' src/ \
  | jq -s '[.[] | select(.type == "match") | {
      file: .data.path.text,
      line: .data.line_number,
      text: (.data.lines.text | rtrimstr("\n"))
    }]'
```

### Group search results by file

```bash
rg --json 'TODO' src/ \
  | jq -s '[.[] | select(.type == "match") | {
      file: .data.path.text,
      line: .data.line_number,
      text: (.data.lines.text | rtrimstr("\n"))
    }]
    | group_by(.file)
    | map({file: .[0].file, count: length, matches: map({line, text})})'
```

### Search and replace preview

Show what a replacement would look like before applying it:

```bash
rg --json 'oldFunction' src/ \
  | jq -s '[.[] | select(.type == "match") | {
      file: .data.path.text,
      line: .data.line_number,
      before: (.data.lines.text | rtrimstr("\n")),
      after: (.data.lines.text | rtrimstr("\n") | gsub("oldFunction"; "newFunction"))
    }]'
```

### Cross-reference search results with file metadata

Combine fd for file info with rg for content search:

```bash
fd -e ts --json | jq -s '[.[].path]' > /tmp/ts_files.json

rg --json 'import.*from' src/ \
  | jq -s --slurpfile files /tmp/ts_files.json '
    [.[] | select(.type == "match") | {
      file: .data.path.text,
      import: (.data.lines.text | rtrimstr("\n") | capture("from [\"'\''](?<mod>[^\"'\'']+)").mod // "unknown")
    }]
    | group_by(.import)
    | map({module: .[0].import, used_in: length, files: map(.file) | unique})
    | sort_by(-.used_in)'
```

---

## Quick Reference: Common jq Patterns

| Task | Pattern |
|---|---|
| Select fields | `jq '{a: .x, b: .y}'` |
| Filter array | `jq '[.[] \| select(.active)]'` |
| Map/transform | `jq '[.[] \| .name]'` or `jq 'map(.name)'` |
| Sort | `jq 'sort_by(.field)'` or `jq 'sort_by(-.field)'` for desc |
| Unique values | `jq '[.[].field] \| unique'` |
| Count | `jq 'length'` or `jq '[.[] \| select(cond)] \| length'` |
| Flatten | `jq 'flatten'` or `jq 'flatten(1)'` for one level |
| Keys of object | `jq 'keys'` |
| String interp | `jq '"Name: \(.name), Age: \(.age)"'` |
| Conditional | `jq 'if .x > 0 then "pos" else "neg" end'` |
| Read from stdin | `echo '{}' \| jq '.'` |
| Pretty print | `jq '.' file.json` |
| Compact output | `jq -c '.' file.json` |
| Raw strings out | `jq -r '.name'` (no quotes) |
| Null coalesce | `jq '.field // "default"'` |
| Multiple files | `jq -s '.' *.json` (slurp into array) |

## Troubleshooting

**jq: error - Cannot iterate over null**: Your path is wrong or the field does not exist. Use `// empty` or `// []` to handle missing paths: `jq '.missing_key // [] | .[]'`.

**Empty output from rg | jq pipeline**: rg likely found no matches. Test `rg pattern file` alone first. If using `--json`, ensure you filter with `select(.type == "match")`.

**fd finds nothing**: Check you are in the right directory. Use `fd -e json --no-ignore` if files are gitignored. Use `fd -H` to include hidden files.

**CSV with commas in values**: jq's `@csv` handles quoting automatically. If values contain quotes, jq escapes them per RFC 4180.

**Large file performance**: For files over 100MB, use `jq --stream` for streaming parse, or split with `split -l` first. rg is already optimized for large files.
