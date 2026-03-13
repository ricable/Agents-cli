/**
 * cli-anything/templates/vlc.ts — VLC-specific template overrides.
 *
 * Provides VLC-specific API surface and backend methods using
 * python-vlc bindings and cvlc subprocess for media operations.
 */

import type { ApiEndpoint } from "../types.js";

export const VLC_API_SURFACE: ApiEndpoint[] = [
  // Playback
  { name: "playback-play", description: "Play a media file", args: [
    { name: "input", type: "string", required: true, description: "Media file path or URL" },
    { name: "fullscreen", type: "boolean", required: false, description: "Start in fullscreen" },
  ], returnType: "object", group: "playback" },
  { name: "playback-pause", description: "Pause or resume current playback", args: [], returnType: "object", group: "playback" },
  { name: "playback-stop", description: "Stop current playback", args: [], returnType: "object", group: "playback" },
  { name: "playback-seek", description: "Seek to a position in the media", args: [
    { name: "position", type: "number", required: true, description: "Position in seconds" },
  ], returnType: "object", group: "playback" },
  { name: "playback-volume", description: "Get or set playback volume", args: [
    { name: "level", type: "integer", required: false, description: "Volume level 0-200 (100=normal)" },
  ], returnType: "object", group: "playback" },
  { name: "playback-status", description: "Get current playback status", args: [], returnType: "object", group: "playback" },
  { name: "playback-set-rate", description: "Set playback speed rate", args: [
    { name: "rate", type: "number", required: true, description: "Playback rate (0.25-4.0, 1.0=normal)" },
  ], returnType: "object", group: "playback" },

  // Playlist
  { name: "playlist-add", description: "Add a media file to the playlist", args: [
    { name: "input", type: "string", required: true, description: "Media file path or URL" },
  ], returnType: "object", group: "playlist" },
  { name: "playlist-list", description: "List all items in the current playlist", args: [], returnType: "object", group: "playlist" },
  { name: "playlist-next", description: "Skip to next item in playlist", args: [], returnType: "object", group: "playlist" },
  { name: "playlist-previous", description: "Go to previous item in playlist", args: [], returnType: "object", group: "playlist" },
  { name: "playlist-clear", description: "Clear the playlist", args: [], returnType: "object", group: "playlist" },
  { name: "playlist-shuffle", description: "Toggle playlist shuffle mode", args: [
    { name: "enabled", type: "boolean", required: false, description: "Enable shuffle (default toggle)" },
  ], returnType: "object", group: "playlist" },

  // Stream
  { name: "stream-start", description: "Start streaming a media file over network", args: [
    { name: "input", type: "string", required: true, description: "Media file path" },
    { name: "protocol", type: "string", required: false, description: "Streaming protocol (http, rtp, rtsp)" },
    { name: "port", type: "integer", required: false, description: "Port number (default 8080)" },
    { name: "mux", type: "string", required: false, description: "Mux format (ts, ogg, mp4)" },
  ], returnType: "object", group: "stream" },
  { name: "stream-stop", description: "Stop active streaming", args: [], returnType: "object", group: "stream" },

  // Transcode
  { name: "transcode-video", description: "Transcode video to a different format", args: [
    { name: "input", type: "string", required: true, description: "Input media file" },
    { name: "output", type: "string", required: true, description: "Output file path" },
    { name: "vcodec", type: "string", required: false, description: "Video codec (h264, h265, mp4v, VP80)" },
    { name: "acodec", type: "string", required: false, description: "Audio codec (mp3, aac, vorb, flac)" },
    { name: "vb", type: "integer", required: false, description: "Video bitrate in kbps" },
    { name: "ab", type: "integer", required: false, description: "Audio bitrate in kbps" },
  ], returnType: "object", group: "transcode" },
  { name: "transcode-audio", description: "Extract and transcode audio from media", args: [
    { name: "input", type: "string", required: true, description: "Input media file" },
    { name: "output", type: "string", required: true, description: "Output audio file" },
    { name: "acodec", type: "string", required: false, description: "Audio codec (mp3, aac, flac)" },
    { name: "ab", type: "integer", required: false, description: "Audio bitrate in kbps" },
  ], returnType: "object", group: "transcode" },
  { name: "transcode-extract-frames", description: "Extract frames from video as images", args: [
    { name: "input", type: "string", required: true, description: "Input video file" },
    { name: "output-dir", type: "string", required: true, description: "Output directory for frames" },
    { name: "ratio", type: "integer", required: false, description: "Extract every Nth frame" },
  ], returnType: "object", group: "transcode" },

  // Info
  { name: "info-media", description: "Get detailed media file information", args: [
    { name: "input", type: "string", required: true, description: "Media file path" },
  ], returnType: "object", group: "info" },
  { name: "info-codecs", description: "List available codecs", args: [
    { name: "type", type: "string", required: false, description: "Filter by type (video, audio, spu)" },
  ], returnType: "object", group: "info" },
];

export function getVlcApiSurface(): ApiEndpoint[] {
  return VLC_API_SURFACE;
}

export const VLC_BACKEND_SNIPPET = `
    def _get_vlc_instance(self):
        \"\"\"Get or create VLC instance.\"\"\"
        if not hasattr(self, "_vlc_instance"):
            import vlc
            self._vlc_instance = vlc.Instance("--no-xlib")
            self._vlc_player = self._vlc_instance.media_player_new()
        return self._vlc_instance, self._vlc_player

    def playback_play(self, input: str = "", fullscreen: bool = False, **kwargs) -> dict:
        \"\"\"Play a media file using python-vlc.\"\"\"
        import vlc
        inst, player = self._get_vlc_instance()
        media = inst.media_new(input)
        player.set_media(media)
        player.set_fullscreen(fullscreen)
        player.play()
        return {"input": input, "fullscreen": fullscreen, "state": "playing"}

    def playback_pause(self, **kwargs) -> dict:
        \"\"\"Pause or resume current playback.\"\"\"
        _, player = self._get_vlc_instance()
        player.pause()
        is_playing = player.is_playing()
        return {"state": "playing" if is_playing else "paused"}

    def playback_stop(self, **kwargs) -> dict:
        \"\"\"Stop current playback.\"\"\"
        _, player = self._get_vlc_instance()
        player.stop()
        return {"state": "stopped"}

    def playback_seek(self, position: float = 0, **kwargs) -> dict:
        \"\"\"Seek to a position in seconds.\"\"\"
        _, player = self._get_vlc_instance()
        player.set_time(int(position * 1000))
        return {"position_sec": position}

    def playback_volume(self, level: int = -1, **kwargs) -> dict:
        \"\"\"Get or set playback volume.\"\"\"
        _, player = self._get_vlc_instance()
        if level >= 0:
            player.audio_set_volume(level)
        return {"volume": player.audio_get_volume()}

    def playback_status(self, **kwargs) -> dict:
        \"\"\"Get current playback status.\"\"\"
        _, player = self._get_vlc_instance()
        length = player.get_length()
        time_ms = player.get_time()
        return {
            "playing": player.is_playing(),
            "position_sec": time_ms / 1000.0 if time_ms > 0 else 0,
            "duration_sec": length / 1000.0 if length > 0 else 0,
            "volume": player.audio_get_volume(),
            "rate": player.get_rate(),
        }

    def playback_set_rate(self, rate: float = 1.0, **kwargs) -> dict:
        \"\"\"Set playback speed rate.\"\"\"
        _, player = self._get_vlc_instance()
        player.set_rate(rate)
        return {"rate": rate}

    def playlist_add(self, input: str = "", **kwargs) -> dict:
        \"\"\"Add a media file to the playlist.\"\"\"
        inst, _ = self._get_vlc_instance()
        if not hasattr(self, "_vlc_list_player"):
            self._vlc_media_list = inst.media_list_new()
            self._vlc_list_player = inst.media_list_player_new()
            self._vlc_list_player.set_media_list(self._vlc_media_list)
        media = inst.media_new(input)
        self._vlc_media_list.add_media(media)
        return {"added": input, "count": self._vlc_media_list.count()}

    def playlist_next(self, **kwargs) -> dict:
        \"\"\"Skip to next item in playlist.\"\"\"
        if hasattr(self, "_vlc_list_player"):
            self._vlc_list_player.next()
        return {"action": "next"}

    def playlist_previous(self, **kwargs) -> dict:
        \"\"\"Go to previous item in playlist.\"\"\"
        if hasattr(self, "_vlc_list_player"):
            self._vlc_list_player.previous()
        return {"action": "previous"}

    def stream_start(self, input: str = "", protocol: str = "http", port: int = 8080, mux: str = "ts", **kwargs) -> dict:
        \"\"\"Start streaming a media file using cvlc subprocess.\"\"\"
        import subprocess
        sout = f"#standard{{access={protocol},mux={mux},dst=:{port}}}"
        proc = subprocess.Popen(
            ["cvlc", input, f"--sout={sout}", "--no-sout-all", "--sout-keep"],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
        )
        self._stream_proc = proc
        return {"input": input, "protocol": protocol, "port": port, "mux": mux, "pid": proc.pid}

    def stream_stop(self, **kwargs) -> dict:
        \"\"\"Stop active streaming.\"\"\"
        if hasattr(self, "_stream_proc"):
            self._stream_proc.terminate()
            self._stream_proc.wait(timeout=5)
            return {"stopped": True}
        return {"stopped": False, "error": "No active stream"}

    def transcode_video(self, input: str = "", output: str = "", vcodec: str = "h264", acodec: str = "mp3", vb: int = 2000, ab: int = 192, **kwargs) -> dict:
        \"\"\"Transcode video using cvlc.\"\"\"
        import subprocess
        sout = f"#transcode{{vcodec={vcodec},vb={vb},acodec={acodec},ab={ab}}}:std{{access=file,mux=mp4,dst={output}}}"
        subprocess.run(["cvlc", "-I", "dummy", input, f"--sout={sout}", "vlc://quit"], check=True, capture_output=True)
        return {"input": input, "output": output, "vcodec": vcodec, "acodec": acodec}

    def transcode_audio(self, input: str = "", output: str = "", acodec: str = "mp3", ab: int = 192, **kwargs) -> dict:
        \"\"\"Extract and transcode audio from media.\"\"\"
        import subprocess
        mux = {"mp3": "mp3", "aac": "mp4", "flac": "flac"}.get(acodec, "mp3")
        sout = f"#transcode{{acodec={acodec},ab={ab},vcodec=none}}:std{{access=file,mux={mux},dst={output}}}"
        subprocess.run(["cvlc", "-I", "dummy", input, f"--sout={sout}", "vlc://quit"], check=True, capture_output=True)
        return {"input": input, "output": output, "acodec": acodec, "ab": ab}

    def info_media(self, input: str = "", **kwargs) -> dict:
        \"\"\"Get detailed media file information.\"\"\"
        import vlc
        inst, _ = self._get_vlc_instance()
        media = inst.media_new(input)
        media.parse_with_options(vlc.MediaParseFlag.local, timeout=5000)
        import time
        time.sleep(1)  # allow parsing
        tracks = []
        for i in range(media.tracks_get()[0] if media.tracks_get() else 0):
            pass
        return {
            "input": input,
            "duration_sec": media.get_duration() / 1000.0 if media.get_duration() > 0 else 0,
            "mrl": media.get_mrl(),
            "state": str(media.get_state()),
        }

    def info_codecs(self, type: str = "", **kwargs) -> dict:
        \"\"\"List available codecs via cvlc.\"\"\"
        import subprocess
        result = subprocess.run(["cvlc", "--list", "--no-color"], capture_output=True, text=True, timeout=5)
        lines = result.stdout.strip().split("\\n") if result.stdout else []
        return {"codecs": lines[:50], "filter": type or "all"}
`;
