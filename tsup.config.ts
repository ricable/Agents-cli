import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: {
      "bin/agents-cli": "bin/agents-cli.ts",
      "bin/agent-run": "bin/agent-run.ts",
    },
    format: ["esm"],
    sourcemap: true,
    target: "node18",
    splitting: false,
    shims: true,
    banner: { js: "#!/usr/bin/env node" },
  },
  {
    entry: { "lib/index": "lib/index.ts" },
    format: ["esm"],
    dts: true,
    sourcemap: true,
    target: "node18",
    splitting: false,
    shims: true,
  },
]);
