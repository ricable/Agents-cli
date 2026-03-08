import type {
  ToolRegistry,
  RegistryEntry,
  RegistrySearchOptions,
} from "./types.js";

/** Create a registry with 4-layer cascade (Phase 3 implementation) */
export function createRegistry(): ToolRegistry {
  return {
    async search(_options: RegistrySearchOptions): Promise<readonly RegistryEntry[]> {
      // Phase 3: local → community → GitHub → npm cascade
      return [];
    },

    async lookup(_id: string): Promise<RegistryEntry | null> {
      // Phase 3: cascade lookup
      return null;
    },

    async publish(_entry: RegistryEntry): Promise<void> {
      // Phase 7: community registry publishing
      throw new Error("Registry publishing not yet implemented");
    },
  };
}
