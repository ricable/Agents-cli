import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    "lib/index": "lib/index.ts",
    "bin/agents-cli": "bin/agents-cli.ts",
  },
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  target: "node18",
  splitting: false,
  shims: true,
  banner: {
    js: "#!/usr/bin/env node",
  },
});
