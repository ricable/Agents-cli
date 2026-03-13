/**
 * cli-anything/templates/blender.ts — Blender-specific template overrides.
 *
 * Provides Blender-specific API surface and backend methods using bpy
 * (Blender Python bindings) for 3D modeling, rendering, and animation.
 */

import type { ApiEndpoint } from "../types.js";

export const BLENDER_API_SURFACE: ApiEndpoint[] = [
  // Scene
  { name: "scene-list", description: "List all scenes in the current blend file", args: [], returnType: "object", group: "scene" },
  { name: "scene-new", description: "Create a new scene", args: [
    { name: "name", type: "string", required: true, description: "Scene name" },
  ], returnType: "object", group: "scene" },
  { name: "scene-set-active", description: "Set the active scene by name", args: [
    { name: "name", type: "string", required: true, description: "Scene name to activate" },
  ], returnType: "object", group: "scene" },

  // Object
  { name: "object-add-cube", description: "Add a cube mesh to the scene", args: [
    { name: "size", type: "number", required: false, description: "Cube size (default 2.0)" },
    { name: "x", type: "number", required: false, description: "X location" },
    { name: "y", type: "number", required: false, description: "Y location" },
    { name: "z", type: "number", required: false, description: "Z location" },
  ], returnType: "object", group: "object" },
  { name: "object-add-sphere", description: "Add a UV sphere to the scene", args: [
    { name: "radius", type: "number", required: false, description: "Sphere radius" },
    { name: "segments", type: "integer", required: false, description: "Number of segments" },
  ], returnType: "object", group: "object" },
  { name: "object-delete", description: "Delete an object by name", args: [
    { name: "name", type: "string", required: true, description: "Object name" },
  ], returnType: "object", group: "object" },
  { name: "object-transform", description: "Set location, rotation, and scale of an object", args: [
    { name: "name", type: "string", required: true, description: "Object name" },
    { name: "location", type: "string", required: false, description: "Location as x,y,z" },
    { name: "rotation", type: "string", required: false, description: "Rotation in degrees as x,y,z" },
    { name: "scale", type: "string", required: false, description: "Scale as x,y,z" },
  ], returnType: "object", group: "object" },
  { name: "object-list", description: "List all objects in the active scene", args: [], returnType: "object", group: "object" },

  // Mesh
  { name: "mesh-subdivide", description: "Subdivide the mesh of an object", args: [
    { name: "name", type: "string", required: true, description: "Object name" },
    { name: "cuts", type: "integer", required: false, description: "Number of cuts (default 1)" },
  ], returnType: "object", group: "mesh" },
  { name: "mesh-info", description: "Get vertex, edge, and face counts for a mesh object", args: [
    { name: "name", type: "string", required: true, description: "Object name" },
  ], returnType: "object", group: "mesh" },

  // Material
  { name: "material-create", description: "Create a new material with a base color", args: [
    { name: "name", type: "string", required: true, description: "Material name" },
    { name: "color", type: "string", required: false, description: "Hex color (e.g. #FF0000)" },
  ], returnType: "object", group: "material" },
  { name: "material-assign", description: "Assign a material to an object", args: [
    { name: "object", type: "string", required: true, description: "Object name" },
    { name: "material", type: "string", required: true, description: "Material name" },
  ], returnType: "object", group: "material" },

  // Render
  { name: "render-set-engine", description: "Set the render engine (CYCLES, BLENDER_EEVEE, BLENDER_WORKBENCH)", args: [
    { name: "engine", type: "string", required: true, description: "Render engine name" },
  ], returnType: "object", group: "render" },
  { name: "render-set-resolution", description: "Set render resolution", args: [
    { name: "width", type: "integer", required: true, description: "Width in pixels" },
    { name: "height", type: "integer", required: true, description: "Height in pixels" },
  ], returnType: "object", group: "render" },
  { name: "render-image", description: "Render the current scene to an image file", args: [
    { name: "output", type: "string", required: true, description: "Output file path" },
    { name: "format", type: "string", required: false, description: "Image format (PNG, JPEG, EXR)" },
  ], returnType: "object", group: "render" },

  // Animation
  { name: "animation-keyframe-insert", description: "Insert a keyframe on an object property", args: [
    { name: "object", type: "string", required: true, description: "Object name" },
    { name: "frame", type: "integer", required: true, description: "Frame number" },
    { name: "data-path", type: "string", required: true, description: "Property path (e.g. location, rotation_euler)" },
  ], returnType: "object", group: "animation" },
  { name: "animation-set-range", description: "Set the animation frame range", args: [
    { name: "start", type: "integer", required: true, description: "Start frame" },
    { name: "end", type: "integer", required: true, description: "End frame" },
  ], returnType: "object", group: "animation" },

  // Modifier
  { name: "modifier-add", description: "Add a modifier to an object", args: [
    { name: "object", type: "string", required: true, description: "Object name" },
    { name: "type", type: "string", required: true, description: "Modifier type (SUBSURF, MIRROR, BOOLEAN, ARRAY)" },
  ], returnType: "object", group: "modifier" },
  { name: "modifier-apply", description: "Apply a modifier on an object", args: [
    { name: "object", type: "string", required: true, description: "Object name" },
    { name: "modifier", type: "string", required: true, description: "Modifier name" },
  ], returnType: "object", group: "modifier" },

  // Export
  { name: "export-gltf", description: "Export scene to glTF/GLB format", args: [
    { name: "output", type: "string", required: true, description: "Output file path (.glb or .gltf)" },
    { name: "selected-only", type: "boolean", required: false, description: "Export selected objects only" },
  ], returnType: "object", group: "export" },
  { name: "export-fbx", description: "Export scene to FBX format", args: [
    { name: "output", type: "string", required: true, description: "Output file path (.fbx)" },
  ], returnType: "object", group: "export" },
  { name: "export-obj", description: "Export scene to OBJ format", args: [
    { name: "output", type: "string", required: true, description: "Output file path (.obj)" },
  ], returnType: "object", group: "export" },
];

export function getBlenderApiSurface(): ApiEndpoint[] {
  return BLENDER_API_SURFACE;
}

export const BLENDER_BACKEND_SNIPPET = `
    def scene_list(self, **kwargs) -> dict:
        \"\"\"List all scenes in the blend file.\"\"\"
        import bpy
        scenes = [{"name": s.name, "objects": len(s.objects)} for s in bpy.data.scenes]
        return {"scenes": scenes, "count": len(scenes)}

    def scene_new(self, name: str = "Scene", **kwargs) -> dict:
        \"\"\"Create a new scene.\"\"\"
        import bpy
        scene = bpy.data.scenes.new(name)
        return {"name": scene.name, "created": True}

    def object_add_cube(self, size: float = 2.0, x: float = 0, y: float = 0, z: float = 0, **kwargs) -> dict:
        \"\"\"Add a cube mesh to the scene.\"\"\"
        import bpy
        bpy.ops.mesh.primitive_cube_add(size=size, location=(x, y, z))
        obj = bpy.context.active_object
        return {"name": obj.name, "type": "MESH", "size": size, "location": [x, y, z]}

    def object_add_sphere(self, radius: float = 1.0, segments: int = 32, **kwargs) -> dict:
        \"\"\"Add a UV sphere to the scene.\"\"\"
        import bpy
        bpy.ops.mesh.primitive_uv_sphere_add(radius=radius, segments=segments)
        obj = bpy.context.active_object
        return {"name": obj.name, "type": "MESH", "radius": radius, "segments": segments}

    def object_delete(self, name: str = "", **kwargs) -> dict:
        \"\"\"Delete an object by name.\"\"\"
        import bpy
        obj = bpy.data.objects.get(name)
        if not obj:
            return {"error": f"Object '{name}' not found"}
        bpy.data.objects.remove(obj, do_unlink=True)
        return {"deleted": name}

    def object_transform(self, name: str = "", location: str = "", rotation: str = "", scale: str = "", **kwargs) -> dict:
        \"\"\"Set location, rotation, and scale of an object.\"\"\"
        import bpy, math
        obj = bpy.data.objects.get(name)
        if not obj:
            return {"error": f"Object '{name}' not found"}
        if location:
            obj.location = tuple(float(v) for v in location.split(","))
        if rotation:
            obj.rotation_euler = tuple(math.radians(float(v)) for v in rotation.split(","))
        if scale:
            obj.scale = tuple(float(v) for v in scale.split(","))
        return {"name": name, "location": list(obj.location), "rotation": list(obj.rotation_euler), "scale": list(obj.scale)}

    def object_list(self, **kwargs) -> dict:
        \"\"\"List all objects in the active scene.\"\"\"
        import bpy
        objects = [{"name": o.name, "type": o.type, "location": list(o.location)} for o in bpy.context.scene.objects]
        return {"objects": objects, "count": len(objects)}

    def mesh_info(self, name: str = "", **kwargs) -> dict:
        \"\"\"Get vertex, edge, and face counts for a mesh.\"\"\"
        import bpy
        obj = bpy.data.objects.get(name)
        if not obj or obj.type != "MESH":
            return {"error": f"Mesh object '{name}' not found"}
        mesh = obj.data
        return {"name": name, "vertices": len(mesh.vertices), "edges": len(mesh.edges), "faces": len(mesh.polygons)}

    def material_create(self, name: str = "Material", color: str = "#808080", **kwargs) -> dict:
        \"\"\"Create a new material with a base color.\"\"\"
        import bpy
        mat = bpy.data.materials.new(name=name)
        mat.use_nodes = True
        bsdf = mat.node_tree.nodes.get("Principled BSDF")
        if bsdf and color.startswith("#"):
            hex_c = color.lstrip("#")
            r, g, b = (int(hex_c[i:i+2], 16) / 255.0 for i in (0, 2, 4))
            bsdf.inputs["Base Color"].default_value = (r, g, b, 1.0)
        return {"name": mat.name, "color": color}

    def render_set_engine(self, engine: str = "CYCLES", **kwargs) -> dict:
        \"\"\"Set the render engine.\"\"\"
        import bpy
        bpy.context.scene.render.engine = engine.upper()
        return {"engine": bpy.context.scene.render.engine}

    def render_image(self, output: str = "/tmp/render.png", format: str = "PNG", **kwargs) -> dict:
        \"\"\"Render the current scene to an image file.\"\"\"
        import bpy
        bpy.context.scene.render.filepath = output
        bpy.context.scene.render.image_settings.file_format = format.upper()
        bpy.ops.render.render(write_still=True)
        return {"output": output, "format": format}

    def modifier_add(self, object: str = "", type: str = "SUBSURF", **kwargs) -> dict:
        \"\"\"Add a modifier to an object.\"\"\"
        import bpy
        obj = bpy.data.objects.get(object)
        if not obj:
            return {"error": f"Object '{object}' not found"}
        mod = obj.modifiers.new(name=type, type=type)
        return {"object": object, "modifier": mod.name, "type": type}

    def export_gltf(self, output: str = "scene.glb", selected_only: bool = False, **kwargs) -> dict:
        \"\"\"Export scene to glTF/GLB format.\"\"\"
        import bpy
        bpy.ops.export_scene.gltf(filepath=output, use_selection=selected_only)
        return {"output": output, "format": "glTF", "selected_only": selected_only}

    def export_fbx(self, output: str = "scene.fbx", **kwargs) -> dict:
        \"\"\"Export scene to FBX format.\"\"\"
        import bpy
        bpy.ops.export_scene.fbx(filepath=output)
        return {"output": output, "format": "FBX"}
`;
