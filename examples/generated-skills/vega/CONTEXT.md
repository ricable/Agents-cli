# vega



- **Version**: 0.0.0
- **Source**: github:vega/vega
- **Status**: installed
- **Installed**: 2026-03-08T17:25:06.276Z

## Global Options

- `--base, -b` — Base directory for data loading. Defaults to the directory
- `--loglevel, -l` — Level of log messages written to stderr. One of "error",
- `--config, -c` — Vega config object. Either a JSON file or a .js file that
- `--format, -f` — Number format locale descriptor. Either a JSON file or a .js
- `--timeFormat, -t` — Date/time format locale descriptor. Either a JSON file or a
- `--scale, -s` — Output resolution scale factor.        [number] [default: 1]
- `--seed` — Seed for random number generation.                  [number]
- `--test` — Disable default PDF metadata for test suites.      [boolean]
- `--help` — Show help                                          [boolean]
- `--version` — Show version number                                [boolean]

## Raw Help Output

```
Render a Vega specification to PDF.
Usage: vg2pdf [vega_json_spec_file] [output_pdf_file]
If no arguments are provided, reads from stdin.
If output_pdf_file is not provided, writes to stdout.
For errors and log messages, writes to stderr.

To load data, you may need to set a base directory:
For web retrieval, use '-b http://host/data/'.
For files, use '-b file:///dir/data/' (absolute) or '-b data/' (relative).

Options:
  -b, --base        Base directory for data loading. Defaults to the directory
                    of the input spec.                                  [string]
  -l, --loglevel    Level of log messages written to stderr. One of "error",
                    "warn" (default), "info", or "debug".               [string]
  -c, --config      Vega config object. Either a JSON file or a .js file that
                    exports the config object.                          [string]
  -f, --format      Number format locale descriptor. Either a JSON file or a .js
                    file that exports the locale object.                [string]
  -t, --timeFormat  Date/time format locale descriptor. Either a JSON file or a
                    .js file that exports the locale object.            [string]
  -s, --scale       Output resolution scale factor.        [number] [default: 1]
      --seed        Seed for random number generation.                  [number]
      --test        Disable default PDF metadata for test suites.      [boolean]
      --help        Show help                                          [boolean]
      --version     Show version number                                [boolean]
```
