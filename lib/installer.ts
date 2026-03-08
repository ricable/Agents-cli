import type {
  ToolInstaller,
  ToolSource,
  InstallOptions,
  InstallResult,
  SourceFormat,
} from "./types.js";

/** Create an installer instance */
export function createInstaller(): ToolInstaller {
  return {
    supports(format: SourceFormat): boolean {
      return ["github", "npm", "tarball", "local"].includes(format);
    },

    async install(
      source: ToolSource,
      dest: string,
      _options?: InstallOptions,
    ): Promise<InstallResult> {
      void dest;

      switch (source.format) {
        case "github":
          return installFromGithub(source);
        case "npm":
          return installFromNpm(source);
        default:
          throw new Error(`Unsupported install format: ${source.format}`);
      }
    },
  };
}

async function installFromGithub(_source: ToolSource): Promise<InstallResult> {
  // Phase 2: GitHub tarball download
  throw new Error("GitHub installation not yet implemented");
}

async function installFromNpm(_source: ToolSource): Promise<InstallResult> {
  // Phase 2: npm package download
  throw new Error("npm installation not yet implemented");
}
