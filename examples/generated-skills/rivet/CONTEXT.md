# rivet



- **Version**: 0.0.0
- **Source**: github:Ironclad/rivet
- **Status**: installed
- **Installed**: 2026-03-08T17:29:40.511Z

## Raw Help Output

```
/Users/cedric/.agents-cli/tools/rivet/package/.pnp.cjs:34473
    throw firstError;
    ^

Error: Package subpath './bin/eslint.js' is not defined by "exports" in /Users/cedric/.agents-cli/tools/rivet/package/.yarn/__virtual__/eslint-virtual-4b08b34d99/0/cache/eslint-npm-9.20.1-5c3419cdfc-b1d870135c.zip/node_modules/eslint/package.json imported from /Users/cedric/.agents-cli/tools/rivet/package/
Require stack:
- /Users/cedric/.agents-cli/tools/rivet/package/.pnp.cjs
    at require$$0.Module._resolveFilename (/Users/cedric/.agents-cli/tools/rivet/package/.pnp.cjs:34472:13)
    at defaultResolveImpl (node:internal/modules/cjs/loader:1025:19)
    at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1030:22)
    at Function.<anonymous> (node:internal/modules/cjs/loader:1192:37)
    at require$$0.Module._load (/Users/cedric/.agents-cli/tools/rivet/package/.pnp.cjs:34363:31)
    at TracingChannel.traceSync (node:diagnostics_channel:328:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:237:24)
    at Module.require (node:internal/modules/cjs/loader:1463:12)
    at require (node:internal/modules/helpers:147:16)
    at Object.<anonymous> (/Users/cedric/.agents-cli/tools/rivet/package/.yarn/sdks/eslint/bin/eslint.js:32:38)

Node.js v22.22.1
```
