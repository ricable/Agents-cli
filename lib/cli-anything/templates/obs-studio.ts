/**
 * cli-anything/templates/obs-studio.ts — OBS Studio-specific template overrides.
 *
 * Provides OBS Studio-specific API surface and backend methods using
 * obsws-python for OBS WebSocket protocol v5 communication.
 */

import type { ApiEndpoint } from "../types.js";

export const OBS_STUDIO_API_SURFACE: ApiEndpoint[] = [
  // Scene
  { name: "scene-list", description: "List all scenes in OBS", args: [], returnType: "object", group: "scene" },
  { name: "scene-get-current", description: "Get the currently active scene", args: [], returnType: "object", group: "scene" },
  { name: "scene-switch", description: "Switch to a different scene by name", args: [
    { name: "name", type: "string", required: true, description: "Scene name to switch to" },
  ], returnType: "object", group: "scene" },
  { name: "scene-create", description: "Create a new scene", args: [
    { name: "name", type: "string", required: true, description: "New scene name" },
  ], returnType: "object", group: "scene" },

  // Source
  { name: "source-list", description: "List all sources in the current scene", args: [
    { name: "scene", type: "string", required: false, description: "Scene name (default: current)" },
  ], returnType: "object", group: "source" },
  { name: "source-add-display", description: "Add a display capture source", args: [
    { name: "scene", type: "string", required: true, description: "Target scene name" },
    { name: "name", type: "string", required: true, description: "Source name" },
    { name: "display", type: "integer", required: false, description: "Display index (default 0)" },
  ], returnType: "object", group: "source" },
  { name: "source-add-browser", description: "Add a browser source with URL", args: [
    { name: "scene", type: "string", required: true, description: "Target scene name" },
    { name: "name", type: "string", required: true, description: "Source name" },
    { name: "url", type: "string", required: true, description: "URL to display" },
    { name: "width", type: "integer", required: false, description: "Width in pixels" },
    { name: "height", type: "integer", required: false, description: "Height in pixels" },
  ], returnType: "object", group: "source" },
  { name: "source-set-visibility", description: "Show or hide a source", args: [
    { name: "scene", type: "string", required: true, description: "Scene name" },
    { name: "source", type: "string", required: true, description: "Source name" },
    { name: "visible", type: "boolean", required: true, description: "Visibility state" },
  ], returnType: "object", group: "source" },
  { name: "source-remove", description: "Remove a source from a scene", args: [
    { name: "scene", type: "string", required: true, description: "Scene name" },
    { name: "source", type: "string", required: true, description: "Source name" },
  ], returnType: "object", group: "source" },

  // Stream
  { name: "stream-start", description: "Start streaming", args: [], returnType: "object", group: "stream" },
  { name: "stream-stop", description: "Stop streaming", args: [], returnType: "object", group: "stream" },
  { name: "stream-status", description: "Get current streaming status", args: [], returnType: "object", group: "stream" },
  { name: "stream-toggle", description: "Toggle streaming on/off", args: [], returnType: "object", group: "stream" },

  // Record
  { name: "record-start", description: "Start recording", args: [], returnType: "object", group: "record" },
  { name: "record-stop", description: "Stop recording and return output path", args: [], returnType: "object", group: "record" },
  { name: "record-pause", description: "Pause current recording", args: [], returnType: "object", group: "record" },
  { name: "record-resume", description: "Resume paused recording", args: [], returnType: "object", group: "record" },
  { name: "record-status", description: "Get current recording status", args: [], returnType: "object", group: "record" },

  // Filter
  { name: "filter-add", description: "Add a filter to a source", args: [
    { name: "source", type: "string", required: true, description: "Source name" },
    { name: "filter-name", type: "string", required: true, description: "Filter name" },
    { name: "filter-type", type: "string", required: true, description: "Filter type (color_key_filter_v2, noise_suppress_filter_v2)" },
  ], returnType: "object", group: "filter" },
  { name: "filter-remove", description: "Remove a filter from a source", args: [
    { name: "source", type: "string", required: true, description: "Source name" },
    { name: "filter-name", type: "string", required: true, description: "Filter name to remove" },
  ], returnType: "object", group: "filter" },

  // Transition
  { name: "transition-set", description: "Set the current scene transition", args: [
    { name: "name", type: "string", required: true, description: "Transition name (Cut, Fade, Swipe, Slide)" },
    { name: "duration", type: "integer", required: false, description: "Transition duration in ms" },
  ], returnType: "object", group: "transition" },
  { name: "transition-list", description: "List available transitions", args: [], returnType: "object", group: "transition" },
];

export function getObsStudioApiSurface(): ApiEndpoint[] {
  return OBS_STUDIO_API_SURFACE;
}

export const OBS_STUDIO_BACKEND_SNIPPET = `
    def _get_obs(self):
        \"\"\"Get or create OBS WebSocket client.\"\"\"
        if not hasattr(self, "_obs_client"):
            import obsws_python as obs
            self._obs_client = obs.ReqClient(host="localhost", port=4455, password="")
        return self._obs_client

    def scene_list(self, **kwargs) -> dict:
        \"\"\"List all scenes in OBS.\"\"\"
        cl = self._get_obs()
        resp = cl.get_scene_list()
        scenes = [{"name": s["sceneName"], "index": s["sceneIndex"]} for s in resp.scenes]
        return {"scenes": scenes, "current": resp.current_program_scene_name, "count": len(scenes)}

    def scene_get_current(self, **kwargs) -> dict:
        \"\"\"Get the currently active scene.\"\"\"
        cl = self._get_obs()
        resp = cl.get_current_program_scene()
        return {"name": resp.current_program_scene_name}

    def scene_switch(self, name: str = "", **kwargs) -> dict:
        \"\"\"Switch to a different scene.\"\"\"
        cl = self._get_obs()
        cl.set_current_program_scene(name)
        return {"switched_to": name}

    def scene_create(self, name: str = "", **kwargs) -> dict:
        \"\"\"Create a new scene.\"\"\"
        cl = self._get_obs()
        cl.create_scene(name)
        return {"created": name}

    def source_list(self, scene: str = "", **kwargs) -> dict:
        \"\"\"List all sources in a scene.\"\"\"
        cl = self._get_obs()
        if not scene:
            scene = cl.get_current_program_scene().current_program_scene_name
        resp = cl.get_scene_item_list(scene)
        items = [{"name": i["sourceName"], "id": i["sceneItemId"], "visible": i["sceneItemEnabled"]} for i in resp.scene_items]
        return {"scene": scene, "sources": items, "count": len(items)}

    def source_set_visibility(self, scene: str = "", source: str = "", visible: bool = True, **kwargs) -> dict:
        \"\"\"Show or hide a source.\"\"\"
        cl = self._get_obs()
        resp = cl.get_scene_item_list(scene)
        item_id = None
        for i in resp.scene_items:
            if i["sourceName"] == source:
                item_id = i["sceneItemId"]
                break
        if item_id is None:
            return {"error": f"Source '{source}' not found in scene '{scene}'"}
        cl.set_scene_item_enabled(scene, item_id, visible)
        return {"scene": scene, "source": source, "visible": visible}

    def stream_start(self, **kwargs) -> dict:
        \"\"\"Start streaming.\"\"\"
        cl = self._get_obs()
        cl.start_stream()
        return {"streaming": True}

    def stream_stop(self, **kwargs) -> dict:
        \"\"\"Stop streaming.\"\"\"
        cl = self._get_obs()
        cl.stop_stream()
        return {"streaming": False}

    def stream_status(self, **kwargs) -> dict:
        \"\"\"Get current streaming status.\"\"\"
        cl = self._get_obs()
        resp = cl.get_stream_status()
        return {"active": resp.output_active, "bytes_sent": resp.output_bytes, "duration": resp.output_duration, "reconnecting": resp.output_reconnecting}

    def record_start(self, **kwargs) -> dict:
        \"\"\"Start recording.\"\"\"
        cl = self._get_obs()
        cl.start_record()
        return {"recording": True}

    def record_stop(self, **kwargs) -> dict:
        \"\"\"Stop recording and return output path.\"\"\"
        cl = self._get_obs()
        resp = cl.stop_record()
        return {"recording": False, "output_path": resp.output_path}

    def record_pause(self, **kwargs) -> dict:
        \"\"\"Pause current recording.\"\"\"
        cl = self._get_obs()
        cl.pause_record()
        return {"paused": True}

    def record_status(self, **kwargs) -> dict:
        \"\"\"Get current recording status.\"\"\"
        cl = self._get_obs()
        resp = cl.get_record_status()
        return {"active": resp.output_active, "paused": resp.output_paused, "duration": resp.output_duration, "bytes": resp.output_bytes}

    def transition_set(self, name: str = "Fade", duration: int = 300, **kwargs) -> dict:
        \"\"\"Set the current scene transition.\"\"\"
        cl = self._get_obs()
        cl.set_current_scene_transition(name)
        cl.set_current_scene_transition_duration(duration)
        return {"transition": name, "duration_ms": duration}

    def transition_list(self, **kwargs) -> dict:
        \"\"\"List available transitions.\"\"\"
        cl = self._get_obs()
        resp = cl.get_scene_transition_list()
        transitions = [{"name": t["transitionName"]} for t in resp.transitions]
        return {"transitions": transitions, "current": resp.current_scene_transition_name}
`;
