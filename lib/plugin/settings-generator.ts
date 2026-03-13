/**
 * plugin/settings-generator.ts — Generate settings.json for Claude Code plugins.
 *
 * Produces a settings.json at plugin root that activates the default
 * domain expert agent.
 */

export interface PluginSettings {
  agent?: string;
}

/**
 * Generate settings.json content for a domain plugin.
 * Activates the domain expert agent by default.
 */
export function generatePluginSettings(domain: string): string {
  const flatDomain = domain.replace(/\//g, "-");
  const settings: PluginSettings = {
    agent: `${flatDomain}-expert`,
  };
  return JSON.stringify(settings, null, 2) + "\n";
}
