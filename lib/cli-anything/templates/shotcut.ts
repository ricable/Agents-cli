/**
 * cli-anything/templates/shotcut.ts — Shotcut-specific template overrides.
 *
 * Provides Shotcut-specific API surface and backend methods using
 * MLT XML manipulation via lxml and melt subprocess for rendering.
 * Similar to Kdenlive but with Shotcut-specific defaults and naming.
 */

import type { ApiEndpoint } from "../types.js";

export const SHOTCUT_API_SURFACE: ApiEndpoint[] = [
  // Project
  { name: "project-new", description: "Create a new Shotcut MLT project", args: [
    { name: "output", type: "string", required: true, description: "Output .mlt file path" },
    { name: "width", type: "integer", required: false, description: "Video width (default 1920)" },
    { name: "height", type: "integer", required: false, description: "Video height (default 1080)" },
    { name: "fps", type: "number", required: false, description: "Frame rate (default 30)" },
  ], returnType: "object", group: "project" },
  { name: "project-info", description: "Get MLT project metadata", args: [
    { name: "input", type: "string", required: true, description: "MLT project file path" },
  ], returnType: "object", group: "project" },
  { name: "project-open", description: "Validate and parse an existing Shotcut project", args: [
    { name: "input", type: "string", required: true, description: "MLT file path" },
  ], returnType: "object", group: "project" },

  // Timeline
  { name: "timeline-add-track", description: "Add a video or audio track", args: [
    { name: "input", type: "string", required: true, description: "Project file path" },
    { name: "type", type: "string", required: true, description: "Track type: video or audio" },
  ], returnType: "object", group: "timeline" },
  { name: "timeline-list-tracks", description: "List all tracks with clip counts", args: [
    { name: "input", type: "string", required: true, description: "Project file path" },
  ], returnType: "object", group: "timeline" },
  { name: "timeline-get-duration", description: "Get total timeline duration in frames and seconds", args: [
    { name: "input", type: "string", required: true, description: "Project file path" },
  ], returnType: "object", group: "timeline" },

  // Clip
  { name: "clip-add", description: "Add a media file to the timeline", args: [
    { name: "input", type: "string", required: true, description: "Project file path" },
    { name: "media", type: "string", required: true, description: "Media file to add" },
    { name: "track", type: "integer", required: false, description: "Track index" },
    { name: "in-point", type: "integer", required: false, description: "In-point in frames" },
    { name: "out-point", type: "integer", required: false, description: "Out-point in frames" },
  ], returnType: "object", group: "clip" },
  { name: "clip-remove", description: "Remove a clip from the timeline by ID", args: [
    { name: "input", type: "string", required: true, description: "Project file path" },
    { name: "clip-id", type: "string", required: true, description: "Clip producer ID" },
  ], returnType: "object", group: "clip" },
  { name: "clip-set-speed", description: "Change clip playback speed", args: [
    { name: "input", type: "string", required: true, description: "Project file path" },
    { name: "clip-id", type: "string", required: true, description: "Clip producer ID" },
    { name: "speed", type: "number", required: true, description: "Speed factor (1.0 = normal)" },
  ], returnType: "object", group: "clip" },

  // Filter
  { name: "filter-add", description: "Add a filter to a clip", args: [
    { name: "input", type: "string", required: true, description: "Project file path" },
    { name: "clip-id", type: "string", required: true, description: "Clip producer ID" },
    { name: "filter", type: "string", required: true, description: "Filter name (brightness, contrast, blur, volume, fadeInBrightness, fadeOutBrightness)" },
    { name: "level", type: "string", required: false, description: "Filter level/value" },
  ], returnType: "object", group: "filter" },
  { name: "filter-list", description: "List filters applied to a clip", args: [
    { name: "input", type: "string", required: true, description: "Project file path" },
    { name: "clip-id", type: "string", required: true, description: "Clip producer ID" },
  ], returnType: "object", group: "filter" },
  { name: "filter-remove", description: "Remove a filter from a clip", args: [
    { name: "input", type: "string", required: true, description: "Project file path" },
    { name: "clip-id", type: "string", required: true, description: "Clip producer ID" },
    { name: "filter-name", type: "string", required: true, description: "Filter name to remove" },
  ], returnType: "object", group: "filter" },

  // Export
  { name: "export-video", description: "Export project to video using melt", args: [
    { name: "input", type: "string", required: true, description: "Project file path" },
    { name: "output", type: "string", required: true, description: "Output video file path" },
    { name: "preset", type: "string", required: false, description: "Export preset (youtube, h264-high, h265, webm)" },
    { name: "width", type: "integer", required: false, description: "Override output width" },
    { name: "height", type: "integer", required: false, description: "Override output height" },
  ], returnType: "object", group: "export" },
  { name: "export-frames", description: "Export individual frames as images", args: [
    { name: "input", type: "string", required: true, description: "Project file path" },
    { name: "output-dir", type: "string", required: true, description: "Output directory for frames" },
    { name: "format", type: "string", required: false, description: "Image format (png, jpg)" },
    { name: "frame-start", type: "integer", required: false, description: "Start frame" },
    { name: "frame-end", type: "integer", required: false, description: "End frame" },
  ], returnType: "object", group: "export" },
  { name: "export-audio", description: "Export audio track only", args: [
    { name: "input", type: "string", required: true, description: "Project file path" },
    { name: "output", type: "string", required: true, description: "Output audio file (wav, mp3, flac)" },
  ], returnType: "object", group: "export" },
];

export function getShotcutApiSurface(): ApiEndpoint[] {
  return SHOTCUT_API_SURFACE;
}

export const SHOTCUT_BACKEND_SNIPPET = `
    def project_new(self, output: str = "project.mlt", width: int = 1920, height: int = 1080, fps: float = 30, **kwargs) -> dict:
        \"\"\"Create a new Shotcut MLT project.\"\"\"
        from lxml import etree
        mlt = etree.Element("mlt", title="Shotcut project")
        profile = etree.SubElement(mlt, "profile",
            description=f"{width}x{height} {fps}fps",
            width=str(width), height=str(height),
            progressive="1", sample_aspect_num="1", sample_aspect_den="1",
            display_aspect_num=str(width), display_aspect_den=str(height),
            frame_rate_num=str(int(fps)), frame_rate_den="1",
            colorspace="709")
        # Main playlist
        playlist = etree.SubElement(mlt, "playlist", id="main_bin")
        playlist.set("title", "Shotcut version 24.01")
        # Default tracks
        tractor = etree.SubElement(mlt, "tractor", id="tractor0")
        for kind in ["V1", "A1"]:
            pl = etree.SubElement(mlt, "playlist", id=kind)
            etree.SubElement(tractor, "track", producer=kind)
        tree = etree.ElementTree(mlt)
        tree.write(output, xml_declaration=True, encoding="utf-8", pretty_print=True)
        return {"output": output, "width": width, "height": height, "fps": fps}

    def project_info(self, input: str = "", **kwargs) -> dict:
        \"\"\"Get MLT project metadata.\"\"\"
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

    def timeline_add_track(self, input: str = "", type: str = "video", **kwargs) -> dict:
        \"\"\"Add a track to the timeline.\"\"\"
        from lxml import etree
        tree = etree.parse(input)
        root = tree.getroot()
        playlists = root.findall(".//playlist")
        prefix = "V" if type == "video" else "A"
        count = sum(1 for p in playlists if p.get("id", "").startswith(prefix))
        track_id = f"{prefix}{count + 1}"
        etree.SubElement(root, "playlist", id=track_id)
        tractor = root.find(".//tractor")
        if tractor is not None:
            etree.SubElement(tractor, "track", producer=track_id)
        tree.write(input, xml_declaration=True, encoding="utf-8", pretty_print=True)
        return {"input": input, "track_id": track_id, "type": type}

    def timeline_list_tracks(self, input: str = "", **kwargs) -> dict:
        \"\"\"List all tracks with clip counts.\"\"\"
        from lxml import etree
        tree = etree.parse(input)
        root = tree.getroot()
        tracks = []
        for pl in root.findall(".//playlist"):
            pid = pl.get("id", "")
            if pid in ("main_bin",):
                continue
            entries = pl.findall("entry")
            tracks.append({"id": pid, "clips": len(entries)})
        return {"tracks": tracks, "count": len(tracks)}

    def clip_add(self, input: str = "", media: str = "", track: int = 0, in_point: int = 0, out_point: int = 0, **kwargs) -> dict:
        \"\"\"Add a media file to the timeline.\"\"\"
        from lxml import etree
        import os
        tree = etree.parse(input)
        root = tree.getroot()
        producers = root.findall(".//producer")
        clip_id = f"producer{len(producers)}"
        producer = etree.SubElement(root, "producer", id=clip_id)
        prop = etree.SubElement(producer, "property", name="resource")
        prop.text = os.path.abspath(media)
        if in_point or out_point:
            producer.set("in", str(in_point))
            producer.set("out", str(out_point))
        # Insert into track playlist
        playlists = [p for p in root.findall(".//playlist") if p.get("id") != "main_bin"]
        if track < len(playlists):
            etree.SubElement(playlists[track], "entry", producer=clip_id)
        tree.write(input, xml_declaration=True, encoding="utf-8", pretty_print=True)
        return {"input": input, "clip_id": clip_id, "media": media, "track": track}

    def filter_add(self, input: str = "", clip_id: str = "", filter: str = "", level: str = "", **kwargs) -> dict:
        \"\"\"Add a filter to a clip.\"\"\"
        from lxml import etree
        tree = etree.parse(input)
        root = tree.getroot()
        producer = root.find(f".//producer[@id='{clip_id}']")
        if producer is None:
            return {"error": f"Clip '{clip_id}' not found"}
        filt = etree.SubElement(producer, "filter")
        svc = etree.SubElement(filt, "property", name="mlt_service")
        svc.text = filter
        if level:
            lvl = etree.SubElement(filt, "property", name="level")
            lvl.text = level
        tree.write(input, xml_declaration=True, encoding="utf-8", pretty_print=True)
        return {"clip_id": clip_id, "filter": filter, "level": level}

    def export_video(self, input: str = "", output: str = "output.mp4", preset: str = "h264-high", width: int = 0, height: int = 0, **kwargs) -> dict:
        \"\"\"Export project to video using melt.\"\"\"
        import subprocess
        codec_map = {"youtube": "libx264", "h264-high": "libx264", "h265": "libx265", "webm": "libvpx-vp9"}
        codec = codec_map.get(preset, "libx264")
        cmd = ["melt", input, "-consumer", f"avformat:{output}", f"vcodec={codec}", "acodec=aac", "ab=192k"]
        if width:
            cmd.append(f"width={width}")
        if height:
            cmd.append(f"height={height}")
        subprocess.run(cmd, check=True, capture_output=True)
        return {"input": input, "output": output, "preset": preset, "codec": codec}

    def export_audio(self, input: str = "", output: str = "audio.wav", **kwargs) -> dict:
        \"\"\"Export audio track only using melt.\"\"\"
        import subprocess
        fmt = output.rsplit(".", 1)[-1]
        acodec = {"wav": "pcm_s16le", "mp3": "libmp3lame", "flac": "flac"}.get(fmt, "pcm_s16le")
        cmd = ["melt", input, "-consumer", f"avformat:{output}", "vn=1", f"acodec={acodec}"]
        subprocess.run(cmd, check=True, capture_output=True)
        return {"input": input, "output": output, "format": fmt}
`;
