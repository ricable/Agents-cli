---
name: jq
version: 1.8.1
description: "Command-line JSON processor for filtering, transforming, and querying JSON data. Use this skill whenever the user needs to parse JSON, extract fields from JSON, transform JSON structures, filter JSON arrays, convert JSON to CSV/TSV, or process API responses — even if they just say 'parse this JSON' or 'get the name field'."
ingredients:
  - jqlang/jq
tags:
  - json
  - data-processing
  - cli
  - transform
  - filter
---

# jq — Command-Line JSON Processor

jq is the swiss-army knife for JSON. It slices, dices, filters, transforms, and reshapes JSON data from any source — APIs, files, other CLI tools. If you see JSON, reach for jq.

## Basic Filters

```bash
# Extract a top-level field
echo '{"name": "alice", "age": 30}' | jq '.name'
# "alice"

# Nested field access
echo '{"user": {"address": {"city": "Paris"}}}' | jq '.user.address.city'
# "Paris"

# Iterate all elements of an array
echo '[{"id": 1}, {"id": 2}, {"id": 3}]' | jq '.[]'

# Access by index / slice
echo '[1,2,3,4,5]' | jq '.[0]'    # 1
echo '[1,2,3,4,5]' | jq '.[2:4]'  # [3, 4]

# Safe navigation — no error if missing
echo '{"name": "alice"}' | jq '.age // empty'
echo '{"a": 1}' | jq '.b?.c?'  # null
```

## Pipe and Composition

```bash
# Chain filters like Unix pipes
echo '[{"name": "alice"}, {"name": "bob"}]' | jq '.[] | .name'
# "alice"
# "bob"

# Comma: extract multiple fields in parallel
echo '{"name": "alice", "age": 30}' | jq '.name, .age'

# Parentheses for grouping
echo '{"a": 1, "b": 2}' | jq '(.a, .b) | . * 10'
```

## Construction

```bash
# Build new objects
echo '{"first": "Alice", "last": "Smith", "age": 30}' | jq '{fullName: (.first + " " + .last), age}'
# {"fullName": "Alice Smith", "age": 30}

# Build arrays from iterated values
echo '[{"name": "alice", "score": 90}, {"name": "bob", "score": 85}]' | jq '[.[] | .name]'
# ["alice", "bob"]

# String interpolation
echo '{"name": "alice", "age": 30}' | jq '"Name: \(.name), Age: \(.age)"'

# Dynamic key names
echo '{"key": "color", "val": "blue"}' | jq '{(.key): .val}'
# {"color": "blue"}
```

## Conditionals

```bash
# select(): keep elements matching a condition
echo '[{"name": "alice", "age": 30}, {"name": "bob", "age": 17}]' | jq '[.[] | select(.age >= 18)]'

# select with string matching
echo '[{"name": "alice"}, {"name": "alex"}, {"name": "bob"}]' | jq '[.[] | select(.name | startswith("al"))]'

# if-then-else
echo '[1,2,3,4,5]' | jq '[.[] | if . > 3 then "big" else "small" end]'

# Alternative operator // (default for null/false)
echo '{"name": "alice"}' | jq '.age // "unknown"'
echo '{}' | jq '.name // .username // "anonymous"'

# Boolean operators
echo '[1,2,3,4,5]' | jq '[.[] | select(. > 2 and . < 5)]'

# try-catch
echo '{"a": "not a number"}' | jq 'try (.a | tonumber) catch "invalid"'
```

## String Operations

```bash
# split / join
echo '"hello-world-foo"' | jq 'split("-")'         # ["hello","world","foo"]
echo '["hello","world"]' | jq 'join(", ")'          # "hello, world"

# test: regex match (boolean)
echo '"user@example.com"' | jq 'test("@.+\\.")'     # true

# Filter array by regex
echo '["foo.js","bar.py","baz.ts"]' | jq '[.[] | select(test("\\.(js|ts)$"))]'

# capture: named regex groups
echo '"2026-03-08"' | jq 'capture("(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})")'

# gsub: global substitution
echo '"foo-bar-baz"' | jq 'gsub("-"; "_")'           # "foo_bar_baz"

# Case conversion
echo '"Hello"' | jq 'ascii_downcase'                 # "hello"
echo '"Hello"' | jq 'ascii_upcase'                   # "HELLO"

# Format strings — @csv, @tsv, @html, @uri, @base64
echo '[["name","age"],["alice",30]]' | jq '.[] | @csv'
echo '"<b>hi</b>"' | jq '@html'                      # "&lt;b&gt;hi&lt;/b&gt;"
echo '"hello world"' | jq '@uri'                      # "hello%20world"
echo '"hello"' | jq '@base64'                         # "aGVsbG8="
echo '"aGVsbG8="' | jq '@base64d'                     # "hello"
```

## Array Operations

```bash
# map: apply filter to every element
echo '[1,2,3]' | jq 'map(. * 2)'                     # [2,4,6]

# sort_by / reverse
echo '[{"n":"c"},{"n":"a"},{"n":"b"}]' | jq 'sort_by(.n)'
echo '[3,1,4,1,5]' | jq 'sort | reverse'

# group_by + aggregation
echo '[{"type":"a","val":1},{"type":"b","val":2},{"type":"a","val":3}]' | \
  jq 'group_by(.type) | map({type: .[0].type, total: map(.val) | add})'

# unique / unique_by
echo '[1,2,2,3,3]' | jq 'unique'                     # [1,2,3]
echo '[{"id":1},{"id":2},{"id":1}]' | jq 'unique_by(.id)'

# flatten
echo '[[1,2],[3,[4,5]]]' | jq 'flatten'              # [1,2,3,4,5]

# length / first / last
echo '[1,2,3]' | jq 'length'                          # 3
echo '[10,20,30]' | jq 'first'                        # 10

# min_by / max_by / add
echo '[{"s":80},{"s":95}]' | jq 'max_by(.s)'
echo '[1,2,3,4]' | jq 'add'                           # 10

# any / all
echo '[1,2,3,4]' | jq 'any(. > 3)'                   # true
echo '[1,2,3,4]' | jq 'all(. > 0)'                    # true

# contains / index
echo '[1,2,3]' | jq 'contains([2,3])'                 # true
echo '["a","b","c"]' | jq 'index("b")'                # 1

# limit: take first N from a generator
echo 'null' | jq '[limit(3; range(100))]'              # [0,1,2]
```

## Object Operations

```bash
# keys / values
echo '{"b":2,"a":1}' | jq 'keys'                      # ["a","b"]
echo '{"a":1,"b":2}' | jq '[values]'                   # [1,2]

# has: check key existence
echo '{"name":"alice"}' | jq 'has("email")'            # false

# to_entries / from_entries / with_entries
echo '{"a":1,"b":2}' | jq 'to_entries'
# [{"key":"a","value":1},{"key":"b","value":2}]

echo '{"a":1,"b":2,"c":3}' | jq 'with_entries(select(.value > 1))'
# {"b":2,"c":3}

# Prefix all keys
echo '{"name":"alice","age":30}' | jq 'with_entries(.key = "user_" + .key)'

# Merge objects
echo '{"a":1,"b":2}' | jq '. * {"b":99,"c":3}'        # {"a":1,"b":99,"c":3}

# Delete keys
echo '{"a":1,"b":2,"c":3}' | jq 'del(.b)'             # {"a":1,"c":3}

# paths / getpath
echo '{"a":{"b":{"c":42}}}' | jq 'getpath(["a","b","c"])'  # 42
```

## Reduction and Iteration

```bash
# reduce: fold into single value
echo '[1,2,3,4,5]' | jq 'reduce .[] as $x (0; . + $x)'  # 15

# reduce to build an object
echo '[{"k":"a","v":1},{"k":"b","v":2}]' | jq 'reduce .[] as $i ({}; . + {($i.k): $i.v})'

# foreach: emit intermediate results
echo 'null' | jq '[foreach range(5) as $x (0; . + $x)]'  # [0,1,3,6,10]

# Count occurrences
echo '["a","b","a","c","b","a"]' | jq 'group_by(.) | map({key: .[0], value: length}) | from_entries'

# Recursive descent — find all strings/numbers
echo '{"a":{"b":{"c":"found"}}}' | jq '.. | strings'
echo '{"a":1,"b":{"c":2}}' | jq '[.. | numbers]'

# walk: transform recursively
echo '{"a":"hello","b":{"c":"world"}}' | jq 'walk(if type == "string" then ascii_upcase else . end)'
```

## Output Control Flags

```bash
# -r  raw output (no quotes)
echo '{"name":"alice"}' | jq -r '.name'                # alice

# -c  compact (single line)
echo '{"a":1,"b":2}' | jq -c '.'                       # {"a":1,"b":2}

# -S  sort keys
echo '{"c":3,"a":1}' | jq -S '.'

# -e  exit status (false/null = exit 1, useful in conditionals)
echo '{"ok":false}' | jq -e '.ok' || echo "falsy!"

# -s (--slurp) read all inputs into array
echo -e '{"a":1}\n{"a":2}\n{"a":3}' | jq -s 'map(.a)'  # [1,2,3]
echo -e '{"a":1}\n{"b":2}' | jq -s 'add'                # {"a":1,"b":2}

# -R (--raw-input) read lines as strings
echo -e "line1\nline2" | jq -R '.'
echo -e "line1\nline2" | jq -Rs 'split("\n") | map(select(. != ""))'

# --arg / --argjson: pass external variables
jq -n --arg name "alice" '{name: $name}'
jq -n --argjson items '[1,2,3]' '$items | map(. * 2)'

# -n (--null-input) generate without stdin
jq -n '{created: now | todate}'

# --tab / --indent N: custom formatting
echo '{"a":1}' | jq --indent 4 '.'
```

## Agent Workflows

### Extract Fields from API Responses

```bash
curl -s https://api.github.com/repos/jqlang/jq | jq '{name: .full_name, stars: .stargazers_count, lang: .language}'
gh api repos/OWNER/REPO/issues | jq '.[] | {number, title, author: .user.login}'
```

### Transform JSON Structures

```bash
# Reshape objects
echo '[{"firstName":"Alice","lastName":"Smith"}]' | \
  jq 'map({name: (.firstName + " " + .lastName), initials: (.firstName[:1] + .lastName[:1])})'

# Pivot rows to keyed object
echo '[{"id":"a","val":1},{"id":"b","val":2}]' | jq 'map({(.id): .val}) | add'

# Flatten nested structure
echo '{"users":[{"name":"a","roles":["admin","user"]},{"name":"b","roles":["user"]}]}' | \
  jq '[.users[] | {name} + {role: .roles[]}]'
```

### Filter and Search

```bash
echo '[{"name":"a","active":true},{"name":"b","active":false}]' | jq '[.[] | select(.active)]'
echo '[{"msg":"error: disk full"},{"msg":"info: ok"}]' | jq '[.[] | select(.msg | test("^error"))]'
echo '[{"s":3},{"s":9},{"s":6}]' | jq 'sort_by(.s) | reverse | .[:2]'
```

### Convert JSON to CSV

```bash
echo '[{"name":"alice","age":30},{"name":"bob","age":25}]' | \
  jq -r '(.[0] | keys_unsorted) as $cols | $cols, (.[] | [.[$cols[]]]) | @csv'
```

### Process NDJSON

```bash
cat large.jsonl | jq 'select(.level == "error")'       # filter (memory efficient)
cat data.jsonl | jq -s '.'                               # convert to JSON array
echo '[{"a":1},{"a":2}]' | jq -c '.[]'                  # convert to NDJSON
```

## Integration with Other Tools

```bash
# curl + jq
curl -s https://api.github.com/users/octocat | jq '{login, name, public_repos}'

# gh + jq
gh api repos/OWNER/REPO/pulls | jq '.[] | {number, title, user: .user.login}'
gh api repos/OWNER/REPO/commits/HEAD/check-runs | \
  jq '.check_runs | map(select(.conclusion == "failure")) | .[].name'
gh run list --json name,status,conclusion | jq '.[] | select(.conclusion == "failure")'

# rg --json + jq
rg --json "TODO" | jq -c 'select(.type == "match") | {file: .data.path.text, line: .data.line_number}'
rg --json "pattern" | jq -s '[.[] | select(.type == "match") | .data.path.text] | group_by(.) | map({file: .[0], count: length})'

# docker + jq
docker inspect mycontainer | jq '.[0].NetworkSettings.Networks | to_entries[] | {network: .key, ip: .value.IPAddress}'

# kubectl + jq
kubectl get pods -o json | jq '.items[] | {name: .metadata.name, status: .status.phase}'
kubectl get pods -o json | jq '[.items[] | select(.status.phase != "Running") | .metadata.name]'

# Build JSON from non-JSON
env | jq -Rs 'split("\n") | map(select(. != "") | split("=") | {key: .[0], value: .[1:] | join("=")}) | from_entries'
jq -s 'add' file1.json file2.json file3.json
```

## Tips and Patterns

```bash
# Debug intermediate values
echo '[1,2,3]' | jq 'map(. * 2 | debug)'

# Type checking
echo '{"a":1,"b":"two","c":[3]}' | jq '.[] | "\(type): \(.)"'

# Define reusable functions
echo '[1,2,3,4,5]' | jq 'def double: . * 2; def even: . % 2 == 0; map(select(even) | double)'

# Access environment variables
NAME=alice jq -n 'env.NAME'

# ISO date handling
echo '"2026-03-08T14:30:00Z"' | jq 'fromdateiso8601 | todate'

# Numeric formatting
echo '3.14159' | jq '. * 100 | floor / 100'           # 3.14
```
