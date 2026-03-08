# cml



- **Version**: 0.20.6
- **Source**: github:iterative/cml
- **Status**: installed
- **Installed**: 2026-03-08T16:27:01.134Z

## Global Options

- `--log` — Logging verbosity
- `--driver` — Git provider where the repository is hosted
- `--repo` — Repository URL or slug
- `--driver-token` — 
- `--help` — Show help                                   [boolean]
- `--version` — Show version number                                       [boolean]

## Raw Help Output

```
cml.js <command>

Commands:
  cml.js check              Manage CI checks
  cml.js comment            Manage comments
  cml.js pr <glob path...>  Manage pull requests
  cml.js runner             Manage self-hosted (cloud & on-premise) CI runners
  cml.js workflow           Manage CI workflows
  cml.js ci                 Prepare Git repository for CML operations

Global Options:
  --log                    Logging verbosity
          [string] [choices: "error", "warn", "info", "debug"] [default: "info"]
  --driver                 Git provider where the repository is hosted
    [string] [choices: "github", "gitlab", "bitbucket"] [default: infer from the
                                                                    environment]
  --repo                   Repository URL or slug
                                  [string] [default: infer from the environment]
  --driver-token, --token  CI driver personal/project access token (PAT)
                                  [string] [default: infer from the environment]
  --help                   Show help                                   [boolean]

Options:
  --version  Show version number                                       [boolean]
```
