/**
 * cli-anything/templates/audacity.ts — Audacity-specific template overrides.
 *
 * Provides Audacity-specific API surface and backend methods using
 * pydub and soundfile for audio processing operations.
 */

import type { ApiEndpoint } from "../types.js";

export const AUDACITY_API_SURFACE: ApiEndpoint[] = [
  // Project
  { name: "project-open", description: "Open an audio file for processing", args: [
    { name: "input", type: "string", required: true, description: "Audio file path" },
  ], returnType: "object", group: "project" },
  { name: "project-info", description: "Get audio file metadata (duration, channels, sample rate)", args: [
    { name: "input", type: "string", required: true, description: "Audio file path" },
  ], returnType: "object", group: "project" },

  // Track
  { name: "track-trim", description: "Trim audio to a time range", args: [
    { name: "input", type: "string", required: true, description: "Audio file path" },
    { name: "start", type: "number", required: true, description: "Start time in seconds" },
    { name: "end", type: "number", required: true, description: "End time in seconds" },
    { name: "output", type: "string", required: false, description: "Output file path" },
  ], returnType: "object", group: "track" },
  { name: "track-split", description: "Split audio at a specific time point", args: [
    { name: "input", type: "string", required: true, description: "Audio file path" },
    { name: "at", type: "number", required: true, description: "Split point in seconds" },
    { name: "output-dir", type: "string", required: false, description: "Output directory" },
  ], returnType: "object", group: "track" },
  { name: "track-concat", description: "Concatenate multiple audio files", args: [
    { name: "inputs", type: "string", required: true, description: "Comma-separated audio file paths" },
    { name: "output", type: "string", required: true, description: "Output file path" },
  ], returnType: "object", group: "track" },
  { name: "track-mix", description: "Mix/overlay two audio tracks together", args: [
    { name: "input1", type: "string", required: true, description: "First audio file" },
    { name: "input2", type: "string", required: true, description: "Second audio file" },
    { name: "output", type: "string", required: true, description: "Output file path" },
  ], returnType: "object", group: "track" },

  // Effect
  { name: "effect-normalize", description: "Normalize audio volume to a target level", args: [
    { name: "input", type: "string", required: true, description: "Audio file path" },
    { name: "headroom", type: "number", required: false, description: "Headroom in dB (default 0.1)" },
    { name: "output", type: "string", required: false, description: "Output file path" },
  ], returnType: "object", group: "effect" },
  { name: "effect-fade-in", description: "Apply fade-in effect", args: [
    { name: "input", type: "string", required: true, description: "Audio file path" },
    { name: "duration", type: "number", required: false, description: "Fade duration in seconds (default 2)" },
    { name: "output", type: "string", required: false, description: "Output file path" },
  ], returnType: "object", group: "effect" },
  { name: "effect-fade-out", description: "Apply fade-out effect", args: [
    { name: "input", type: "string", required: true, description: "Audio file path" },
    { name: "duration", type: "number", required: false, description: "Fade duration in seconds (default 2)" },
    { name: "output", type: "string", required: false, description: "Output file path" },
  ], returnType: "object", group: "effect" },
  { name: "effect-speed", description: "Change playback speed without changing pitch", args: [
    { name: "input", type: "string", required: true, description: "Audio file path" },
    { name: "factor", type: "number", required: true, description: "Speed factor (0.5 = half, 2.0 = double)" },
    { name: "output", type: "string", required: false, description: "Output file path" },
  ], returnType: "object", group: "effect" },
  { name: "effect-reverse", description: "Reverse the audio", args: [
    { name: "input", type: "string", required: true, description: "Audio file path" },
    { name: "output", type: "string", required: false, description: "Output file path" },
  ], returnType: "object", group: "effect" },
  { name: "effect-volume", description: "Adjust volume by dB amount", args: [
    { name: "input", type: "string", required: true, description: "Audio file path" },
    { name: "db", type: "number", required: true, description: "Volume change in dB (positive = louder)" },
    { name: "output", type: "string", required: false, description: "Output file path" },
  ], returnType: "object", group: "effect" },

  // Export
  { name: "export-wav", description: "Export audio as WAV", args: [
    { name: "input", type: "string", required: true, description: "Audio file path" },
    { name: "output", type: "string", required: true, description: "Output WAV path" },
    { name: "sample-rate", type: "integer", required: false, description: "Sample rate (e.g. 44100)" },
  ], returnType: "object", group: "export" },
  { name: "export-mp3", description: "Export audio as MP3", args: [
    { name: "input", type: "string", required: true, description: "Audio file path" },
    { name: "output", type: "string", required: true, description: "Output MP3 path" },
    { name: "bitrate", type: "string", required: false, description: "Bitrate (e.g. 192k, 320k)" },
  ], returnType: "object", group: "export" },
  { name: "export-flac", description: "Export audio as FLAC (lossless)", args: [
    { name: "input", type: "string", required: true, description: "Audio file path" },
    { name: "output", type: "string", required: true, description: "Output FLAC path" },
  ], returnType: "object", group: "export" },

  // Analyze
  { name: "analyze-duration", description: "Get audio duration in seconds", args: [
    { name: "input", type: "string", required: true, description: "Audio file path" },
  ], returnType: "object", group: "analyze" },
  { name: "analyze-loudness", description: "Measure audio loudness (dBFS)", args: [
    { name: "input", type: "string", required: true, description: "Audio file path" },
  ], returnType: "object", group: "analyze" },

  // Generate
  { name: "generate-silence", description: "Generate a silent audio file", args: [
    { name: "duration", type: "number", required: true, description: "Duration in seconds" },
    { name: "output", type: "string", required: true, description: "Output file path" },
    { name: "sample-rate", type: "integer", required: false, description: "Sample rate (default 44100)" },
  ], returnType: "object", group: "generate" },
  { name: "generate-tone", description: "Generate a sine wave tone", args: [
    { name: "frequency", type: "number", required: true, description: "Frequency in Hz" },
    { name: "duration", type: "number", required: true, description: "Duration in seconds" },
    { name: "output", type: "string", required: true, description: "Output file path" },
  ], returnType: "object", group: "generate" },
];

export function getAudacityApiSurface(): ApiEndpoint[] {
  return AUDACITY_API_SURFACE;
}

export const AUDACITY_BACKEND_SNIPPET = `
    def project_info(self, input: str = "", **kwargs) -> dict:
        \"\"\"Get audio file metadata using pydub.\"\"\"
        from pydub import AudioSegment
        audio = AudioSegment.from_file(input)
        return {
            "path": input,
            "duration_sec": len(audio) / 1000.0,
            "channels": audio.channels,
            "sample_rate": audio.frame_rate,
            "sample_width": audio.sample_width,
            "frame_count": audio.frame_count(),
            "dbfs": round(audio.dBFS, 2),
        }

    def track_trim(self, input: str = "", start: float = 0, end: float = 0, output: str = "", **kwargs) -> dict:
        \"\"\"Trim audio to a time range.\"\"\"
        from pydub import AudioSegment
        audio = AudioSegment.from_file(input)
        trimmed = audio[int(start * 1000):int(end * 1000)]
        out = output or input
        trimmed.export(out, format=out.rsplit(".", 1)[-1])
        return {"input": input, "output": out, "start": start, "end": end, "duration_sec": len(trimmed) / 1000.0}

    def track_concat(self, inputs: str = "", output: str = "", **kwargs) -> dict:
        \"\"\"Concatenate multiple audio files.\"\"\"
        from pydub import AudioSegment
        files = [f.strip() for f in inputs.split(",")]
        combined = AudioSegment.empty()
        for f in files:
            combined += AudioSegment.from_file(f)
        combined.export(output, format=output.rsplit(".", 1)[-1])
        return {"output": output, "files": len(files), "duration_sec": len(combined) / 1000.0}

    def track_mix(self, input1: str = "", input2: str = "", output: str = "", **kwargs) -> dict:
        \"\"\"Mix/overlay two audio tracks together.\"\"\"
        from pydub import AudioSegment
        a1 = AudioSegment.from_file(input1)
        a2 = AudioSegment.from_file(input2)
        mixed = a1.overlay(a2)
        mixed.export(output, format=output.rsplit(".", 1)[-1])
        return {"output": output, "duration_sec": len(mixed) / 1000.0}

    def effect_normalize(self, input: str = "", headroom: float = 0.1, output: str = "", **kwargs) -> dict:
        \"\"\"Normalize audio volume.\"\"\"
        from pydub import AudioSegment
        from pydub.effects import normalize
        audio = AudioSegment.from_file(input)
        normalized = normalize(audio, headroom=headroom)
        out = output or input
        normalized.export(out, format=out.rsplit(".", 1)[-1])
        return {"input": input, "output": out, "headroom": headroom}

    def effect_fade_in(self, input: str = "", duration: float = 2.0, output: str = "", **kwargs) -> dict:
        \"\"\"Apply fade-in effect.\"\"\"
        from pydub import AudioSegment
        audio = AudioSegment.from_file(input)
        faded = audio.fade_in(int(duration * 1000))
        out = output or input
        faded.export(out, format=out.rsplit(".", 1)[-1])
        return {"input": input, "output": out, "fade_duration": duration}

    def effect_fade_out(self, input: str = "", duration: float = 2.0, output: str = "", **kwargs) -> dict:
        \"\"\"Apply fade-out effect.\"\"\"
        from pydub import AudioSegment
        audio = AudioSegment.from_file(input)
        faded = audio.fade_out(int(duration * 1000))
        out = output or input
        faded.export(out, format=out.rsplit(".", 1)[-1])
        return {"input": input, "output": out, "fade_duration": duration}

    def effect_reverse(self, input: str = "", output: str = "", **kwargs) -> dict:
        \"\"\"Reverse the audio.\"\"\"
        from pydub import AudioSegment
        audio = AudioSegment.from_file(input)
        reversed_audio = audio.reverse()
        out = output or input
        reversed_audio.export(out, format=out.rsplit(".", 1)[-1])
        return {"input": input, "output": out}

    def effect_volume(self, input: str = "", db: float = 0, output: str = "", **kwargs) -> dict:
        \"\"\"Adjust volume by dB amount.\"\"\"
        from pydub import AudioSegment
        audio = AudioSegment.from_file(input)
        adjusted = audio + db
        out = output or input
        adjusted.export(out, format=out.rsplit(".", 1)[-1])
        return {"input": input, "output": out, "db_change": db}

    def export_mp3(self, input: str = "", output: str = "", bitrate: str = "192k", **kwargs) -> dict:
        \"\"\"Export audio as MP3.\"\"\"
        from pydub import AudioSegment
        audio = AudioSegment.from_file(input)
        audio.export(output, format="mp3", bitrate=bitrate)
        return {"input": input, "output": output, "format": "mp3", "bitrate": bitrate}

    def analyze_duration(self, input: str = "", **kwargs) -> dict:
        \"\"\"Get audio duration in seconds.\"\"\"
        from pydub import AudioSegment
        audio = AudioSegment.from_file(input)
        return {"input": input, "duration_sec": len(audio) / 1000.0}

    def analyze_loudness(self, input: str = "", **kwargs) -> dict:
        \"\"\"Measure audio loudness (dBFS).\"\"\"
        from pydub import AudioSegment
        audio = AudioSegment.from_file(input)
        return {"input": input, "dbfs": round(audio.dBFS, 2), "max_dbfs": round(audio.max_dBFS, 2)}

    def generate_silence(self, duration: float = 1.0, output: str = "silence.wav", sample_rate: int = 44100, **kwargs) -> dict:
        \"\"\"Generate a silent audio file.\"\"\"
        from pydub import AudioSegment
        silence = AudioSegment.silent(duration=int(duration * 1000), frame_rate=sample_rate)
        silence.export(output, format=output.rsplit(".", 1)[-1])
        return {"output": output, "duration_sec": duration, "sample_rate": sample_rate}

    def generate_tone(self, frequency: float = 440, duration: float = 1.0, output: str = "tone.wav", **kwargs) -> dict:
        \"\"\"Generate a sine wave tone.\"\"\"
        from pydub.generators import Sine
        tone = Sine(frequency).to_audio_segment(duration=int(duration * 1000))
        tone.export(output, format=output.rsplit(".", 1)[-1])
        return {"output": output, "frequency": frequency, "duration_sec": duration}
`;
