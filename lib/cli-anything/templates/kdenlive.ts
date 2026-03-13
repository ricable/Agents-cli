/**
 * cli-anything/templates/kdenlive.ts — Kdenlive-specific template overrides.
 *
 * Provides Kdenlive-specific API surface and backend methods using
 * MLT XML manipulation via lxml and melt subprocess for rendering.
 */

import type { ApiEndpoint } from "../types.js";

export const KDENLIVE_API_SURFACE: ApiEndpoint[] = [
  // Project
  { name: "project-new", description: "Create a new Kdenlive project", args: [
    { name: "output", type: "string", required: true, description: "Output .kdenlive file path" },
    { name: "width", type: "integer", required: false, description: "Video width (default 1920)" },
    { name: "height", type: "integer", required: false, description: "Video height (default 1080)" },
    { name: "fps", type: "number", required: false, description: "Frame rate (default 25)" },
  ], returnType: "object", group: "project" },
  { name: "project-info", description: "Get project metadata (resolution, fps, duration, track count)", args: [
    { name: "input", type: "string", required: true, description: "Kdenlive project file path" },
  ], returnType: "object", group: "project" },

  // Timeline
  { name: "timeline-add-track", description: "Add a video or audio track to the timeline", args: [
    { name: "input", type: "string", required: true, description: "Project file path" },
    { name: "type", type: "string", required: true, description: "Track type: video or audio" },
    { name: "name", type: "string", required: false, description: "Track name" },
  ], returnType: "object", group: "timeline" },
  { name: "timeline-list-tracks", description: "List all tracks in the timeline", args: [
    { name: "input", type: "string", required: true, description: "Project file path" },
  ], returnType: "object", group: "timeline" },

  // Clip
  { name: "clip-add", description: "Add a media clip to the project bin", args: [
    { name: "input", type: "string", required: true, description: "Project file path" },
    { name: "media", type: "string", required: true, description: "Media file path to add" },
  ], returnType: "object", group: "clip" },
  { name: "clip-insert", description: "Insert a clip into the timeline at a position", args: [
    { name: "input", type: "string", required: true, description: "Project file path" },
    { name: "media", type: "string", required: true, description: "Media file path" },
    { name: "track", type: "integer", required: false, description: "Track index (default 0)" },
    { name: "position", type: "integer", required: false, description: "Position in frames" },
  ], returnType: "object", group: "clip" },
  { name: "clip-remove", description: "Remove a clip from the timeline", args: [
    { name: "input", type: "string", required: true, description: "Project file path" },
    { name: "clip-id", type: "string", required: true, description: "Clip ID to remove" },
  ], returnType: "object", group: "clip" },
  { name: "clip-info", description: "Get media file information (duration, codec, resolution)", args: [
    { name: "media", type: "string", required: true, description: "Media file path" },
  ], returnType: "object", group: "clip" },

  // Effect
  { name: "effect-add", description: "Add an effect to a clip on the timeline", args: [
    { name: "input", type: "string", required: true, description: "Project file path" },
    { name: "clip-id", type: "string", required: true, description: "Clip ID" },
    { name: "effect", type: "string", required: true, description: "Effect name (brightness, volume, blur, fadein, fadeout)" },
    { name: "value", type: "string", required: false, description: "Effect parameter value" },
  ], returnType: "object", group: "effect" },
  { name: "effect-list", description: "List available MLT effects", args: [], returnType: "object", group: "effect" },
  { name: "effect-remove", description: "Remove an effect from a clip", args: [
    { name: "input", type: "string", required: true, description: "Project file path" },
    { name: "clip-id", type: "string", required: true, description: "Clip ID" },
    { name: "effect", type: "string", required: true, description: "Effect name to remove" },
  ], returnType: "object", group: "effect" },

  // Transition
  { name: "transition-add", description: "Add a transition between two clips", args: [
    { name: "input", type: "string", required: true, description: "Project file path" },
    { name: "type", type: "string", required: true, description: "Transition type (dissolve, wipe, slide)" },
    { name: "track-a", type: "integer", required: true, description: "First track index" },
    { name: "track-b", type: "integer", required: true, description: "Second track index" },
    { name: "duration", type: "integer", required: false, description: "Duration in frames" },
  ], returnType: "object", group: "transition" },

  // Render
  { name: "render-project", description: "Render project to a video file using melt", args: [
    { name: "input", type: "string", required: true, description: "Project file path" },
    { name: "output", type: "string", required: true, description: "Output video file path" },
    { name: "codec", type: "string", required: false, description: "Video codec (libx264, libx265, vp9)" },
    { name: "quality", type: "integer", required: false, description: "Quality preset (1-51, lower=better)" },
  ], returnType: "object", group: "render" },
  { name: "render-segment", description: "Render a segment of the timeline", args: [
    { name: "input", type: "string", required: true, description: "Project file path" },
    { name: "output", type: "string", required: true, description: "Output video file path" },
    { name: "in-frame", type: "integer", required: true, description: "Start frame" },
    { name: "out-frame", type: "integer", required: true, description: "End frame" },
  ], returnType: "object", group: "render" },
];

export function getKdenliveApiSurface(): ApiEndpoint[] {
  return KDENLIVE_API_SURFACE;
}

export const KDENLIVE_BACKEND_SNIPPET = `
    def project_new(self, output: str = "project.kdenlive", width: int = 1920, height: int = 1080, fps: float = 25, **kwargs) -> dict:
        \"\"\"Create a new Kdenlive project (MLT XML).\"\"\"
        from lxml import etree
        mlt = etree.Element("mlt")
        profile = etree.SubElement(mlt, "profile", width=str(width), height=str(height), frame_rate_num=str(int(fps)), frame_rate_den="1", progressive="1")
        tractor = etree.SubElement(mlt, "tractor", id="tractor0")
        # Add default video and audio tracks
        for i, kind in enumerate(["video", "audio"]):
            playlist = etree.SubElement(mlt, "playlist", id=f"{kind}_track_{i}")
            etree.SubElement(tractor, "track", producer=f"{kind}_track_{i}")
        tree = etree.ElementTree(mlt)
        tree.write(output, xml_declaration=True, encoding="utf-8", pretty_print=True)
        return {"output": output, "width": width, "height": height, "fps": fps}

    def project_info(self, input: str = "", **kwargs) -> dict:
        \"\"\"Get project metadata from MLT XML.\"\"\"
        from lxml import etree
        tree = etree.parse(input)
        root = tree.getroot()
        profile = root.find(".//profile")
        playlists = root.findall(".//playlist")
        producers = root.findall(".//producer")
        info = {"path": input, "tracks": len(playlists), "clips": len(producers)}
        if profile is not None:
            info["width"] = profile.get("width")
            info["height"] = profile.get("height")
            info["fps"] = profile.get("frame_rate_num")
        return info

    def timeline_add_track(self, input: str = "", type: str = "video", name: str = "", **kwargs) -> dict:
        \"\"\"Add a track to the timeline.\"\"\"
        from lxml import etree
        tree = etree.parse(input)
        root = tree.getroot()
        playlists = root.findall(".//playlist")
        track_id = name or f"{type}_track_{len(playlists)}"
        playlist = etree.SubElement(root, "playlist", id=track_id)
        tractor = root.find(".//tractor")
        if tractor is not None:
            etree.SubElement(tractor, "track", producer=track_id)
        tree.write(input, xml_declaration=True, encoding="utf-8", pretty_print=True)
        return {"input": input, "track_id": track_id, "type": type}

    def clip_add(self, input: str = "", media: str = "", **kwargs) -> dict:
        \"\"\"Add a media clip as a producer in the MLT XML.\"\"\"
        from lxml import etree
        import os
        tree = etree.parse(input)
        root = tree.getroot()
        producers = root.findall(".//producer")
        clip_id = f"producer{len(producers)}"
        producer = etree.SubElement(root, "producer", id=clip_id)
        prop = etree.SubElement(producer, "property", name="resource")
        prop.text = os.path.abspath(media)
        tree.write(input, xml_declaration=True, encoding="utf-8", pretty_print=True)
        return {"input": input, "clip_id": clip_id, "media": media}

    def clip_insert(self, input: str = "", media: str = "", track: int = 0, position: int = 0, **kwargs) -> dict:
        \"\"\"Insert a clip into the timeline at a position.\"\"\"
        from lxml import etree
        import os
        tree = etree.parse(input)
        root = tree.getroot()
        # Create producer
        producers = root.findall(".//producer")
        clip_id = f"producer{len(producers)}"
        producer = etree.SubElement(root, "producer", id=clip_id)
        prop = etree.SubElement(producer, "property", name="resource")
        prop.text = os.path.abspath(media)
        # Add to track playlist
        playlists = root.findall(".//playlist")
        if track < len(playlists):
            entry = etree.SubElement(playlists[track], "entry", producer=clip_id)
        tree.write(input, xml_declaration=True, encoding="utf-8", pretty_print=True)
        return {"input": input, "clip_id": clip_id, "track": track, "position": position}

    def clip_info(self, media: str = "", **kwargs) -> dict:
        \"\"\"Get media file information using melt.\"\"\"
        import subprocess, json
        result = subprocess.run(
            ["melt", media, "-consumer", "xml"],
            capture_output=True, text=True, timeout=10
        )
        return {"media": media, "raw_info": result.stdout[:500]}

    def effect_add(self, input: str = "", clip_id: str = "", effect: str = "", value: str = "", **kwargs) -> dict:
        \"\"\"Add an MLT effect (filter) to a clip.\"\"\"
        from lxml import etree
        tree = etree.parse(input)
        root = tree.getroot()
        producer = root.find(f".//producer[@id='{clip_id}']")
        if producer is None:
            return {"error": f"Clip '{clip_id}' not found"}
        filt = etree.SubElement(producer, "filter", id=f"{clip_id}_{effect}")
        svc = etree.SubElement(filt, "property", name="mlt_service")
        svc.text = effect
        if value:
            val_prop = etree.SubElement(filt, "property", name="level")
            val_prop.text = value
        tree.write(input, xml_declaration=True, encoding="utf-8", pretty_print=True)
        return {"input": input, "clip_id": clip_id, "effect": effect}

    def render_project(self, input: str = "", output: str = "output.mp4", codec: str = "libx264", quality: int = 23, **kwargs) -> dict:
        \"\"\"Render project to a video file using melt.\"\"\"
        import subprocess
        cmd = [
            "melt", input,
            "-consumer", f"avformat:{output}",
            f"vcodec={codec}", f"crf={quality}", "acodec=aac", "ab=192k"
        ]
        subprocess.run(cmd, check=True, capture_output=True)
        return {"input": input, "output": output, "codec": codec, "quality": quality}

    def render_segment(self, input: str = "", output: str = "segment.mp4", in_frame: int = 0, out_frame: int = 0, **kwargs) -> dict:
        \"\"\"Render a segment of the timeline.\"\"\"
        import subprocess
        cmd = [
            "melt", input,
            "in=" + str(in_frame), "out=" + str(out_frame),
            "-consumer", f"avformat:{output}", "vcodec=libx264", "acodec=aac"
        ]
        subprocess.run(cmd, check=True, capture_output=True)
        return {"input": input, "output": output, "in_frame": in_frame, "out_frame": out_frame}
`;
