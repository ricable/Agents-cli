/**
 * cli-anything/registry.ts — Known application registry for CLI-Anything.
 *
 * Each entry defines an app's binaries, scriptability, backend type,
 * available Python bindings, and install hints. Used by app-detector
 * to build AppProfile from system introspection.
 */

import type { AppRegistryEntry } from "./types.js";

export const APP_REGISTRY: Record<string, AppRegistryEntry> = {
  gimp: {
    name: "gimp",
    displayName: "GIMP",
    category: "creative",
    binaries: ["gimp", "gimp-2.10", "gimp-2.99"],
    scriptable: true,
    backendType: "python-binding",
    bindings: ["Pillow", "gi.repository.Gimp"],
    installHint: "brew install --cask gimp  # or https://www.gimp.org/downloads/",
    apiGroups: ["project", "image", "layer", "filter", "color", "batch", "export"],
    templateModule: "gimp",
  },
  blender: {
    name: "blender",
    displayName: "Blender",
    category: "creative",
    binaries: ["blender"],
    scriptable: true,
    backendType: "python-binding",
    bindings: ["bpy"],
    installHint: "brew install --cask blender  # or https://www.blender.org/download/",
    apiGroups: ["scene", "object", "mesh", "material", "render", "animation", "modifier", "export"],
  },
  inkscape: {
    name: "inkscape",
    displayName: "Inkscape",
    category: "creative",
    binaries: ["inkscape"],
    scriptable: true,
    backendType: "subprocess",
    bindings: ["lxml", "svgwrite"],
    installHint: "brew install --cask inkscape  # or https://inkscape.org/release/",
    apiGroups: ["document", "object", "path", "text", "export", "transform"],
  },
  audacity: {
    name: "audacity",
    displayName: "Audacity",
    category: "creative",
    binaries: ["audacity"],
    scriptable: true,
    backendType: "subprocess",
    bindings: ["pydub", "soundfile", "scipy.io.wavfile"],
    installHint: "brew install --cask audacity  # or https://www.audacityteam.org/download/",
    apiGroups: ["project", "track", "effect", "export", "analyze", "generate"],
  },
  libreoffice: {
    name: "libreoffice",
    displayName: "LibreOffice",
    category: "office",
    binaries: ["libreoffice", "soffice"],
    scriptable: true,
    backendType: "subprocess",
    bindings: ["python-docx", "openpyxl", "python-pptx", "odfpy"],
    installHint: "brew install --cask libreoffice  # or https://www.libreoffice.org/download/",
    apiGroups: ["document", "spreadsheet", "presentation", "convert", "macro", "template"],
  },
  "obs-studio": {
    name: "obs-studio",
    displayName: "OBS Studio",
    category: "creative",
    binaries: ["obs"],
    scriptable: true,
    backendType: "rest-api",
    bindings: ["obsws-python", "obs-websocket-py"],
    installHint: "brew install --cask obs  # or https://obsproject.com/download",
    apiGroups: ["scene", "source", "stream", "record", "filter", "transition"],
  },
  kdenlive: {
    name: "kdenlive",
    displayName: "Kdenlive",
    category: "creative",
    binaries: ["kdenlive", "melt"],
    scriptable: true,
    backendType: "subprocess",
    bindings: ["lxml"],
    installHint: "brew install --cask kdenlive  # or https://kdenlive.org/download/",
    apiGroups: ["project", "timeline", "clip", "effect", "transition", "render"],
  },
  shotcut: {
    name: "shotcut",
    displayName: "Shotcut",
    category: "creative",
    binaries: ["shotcut", "melt"],
    scriptable: true,
    backendType: "subprocess",
    bindings: ["lxml"],
    installHint: "brew install --cask shotcut  # or https://shotcut.org/download/",
    apiGroups: ["project", "timeline", "clip", "filter", "export"],
  },
  zoom: {
    name: "zoom",
    displayName: "Zoom",
    category: "communication",
    binaries: ["zoom"],
    scriptable: true,
    backendType: "rest-api",
    bindings: ["requests"],
    installHint: "brew install --cask zoom  # or https://zoom.us/download",
    apiGroups: ["meeting", "user", "recording", "report", "webinar"],
  },
  drawio: {
    name: "drawio",
    displayName: "Draw.io",
    category: "office",
    binaries: ["drawio", "draw.io"],
    scriptable: true,
    backendType: "subprocess",
    bindings: ["lxml"],
    installHint: "brew install --cask drawio  # or https://github.com/jgraph/drawio-desktop/releases",
    apiGroups: ["diagram", "shape", "connection", "export", "style"],
  },
  vlc: {
    name: "vlc",
    displayName: "VLC",
    category: "creative",
    binaries: ["vlc", "cvlc"],
    scriptable: true,
    backendType: "subprocess",
    bindings: ["python-vlc"],
    installHint: "brew install --cask vlc  # or https://www.videolan.org/vlc/",
    apiGroups: ["playback", "playlist", "stream", "transcode", "info"],
  },
};

/**
 * Get a registry entry by app name (case-insensitive).
 */
export function getAppEntry(name: string): AppRegistryEntry | undefined {
  const key = name.toLowerCase().replace(/\s+/g, "-");
  return APP_REGISTRY[key];
}

/**
 * List all registered app names.
 */
export function listRegisteredApps(): string[] {
  return Object.keys(APP_REGISTRY);
}

/**
 * Get apps by category.
 */
export function getAppsByCategory(category: string): AppRegistryEntry[] {
  return Object.values(APP_REGISTRY).filter(e => e.category === category);
}
