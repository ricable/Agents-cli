/**
 * cli-anything/templates/gimp.ts — GIMP-specific template overrides.
 *
 * Provides GIMP-specific API surface, backend methods, and test fixtures
 * that enrich the generic pipeline output with real GIMP functionality.
 */

import type { ApiEndpoint } from "../types.js";

/**
 * GIMP-specific API surface with real Pillow/GIMP operations.
 */
export const GIMP_API_SURFACE: ApiEndpoint[] = [
  // Project management
  { name: "project-list", description: "List GIMP project files in current directory", args: [], returnType: "object", group: "project" },
  { name: "project-new", description: "Create a new GIMP project", args: [{ name: "name", type: "string", required: true, description: "Project name" }], returnType: "object", group: "project" },
  { name: "project-open", description: "Open an existing GIMP project", args: [{ name: "path", type: "string", required: true, description: "Project file path" }], returnType: "object", group: "project" },
  { name: "project-save", description: "Save current project", args: [{ name: "path", type: "string", required: false, description: "Save path" }], returnType: "object", group: "project" },

  // Image operations
  { name: "image-resize", description: "Resize an image to specified dimensions", args: [
    { name: "input", type: "string", required: true, description: "Input image path" },
    { name: "width", type: "integer", required: false, description: "Target width in pixels" },
    { name: "height", type: "integer", required: false, description: "Target height in pixels" },
    { name: "output", type: "string", required: false, description: "Output path" },
  ], returnType: "object", group: "image" },
  { name: "image-info", description: "Show image metadata (dimensions, format, color mode)", args: [
    { name: "input", type: "string", required: true, description: "Image file path" },
  ], returnType: "object", group: "image" },
  { name: "image-crop", description: "Crop image to specified region", args: [
    { name: "input", type: "string", required: true, description: "Input image path" },
    { name: "left", type: "integer", required: true, description: "Left coordinate" },
    { name: "top", type: "integer", required: true, description: "Top coordinate" },
    { name: "right", type: "integer", required: true, description: "Right coordinate" },
    { name: "bottom", type: "integer", required: true, description: "Bottom coordinate" },
  ], returnType: "object", group: "image" },
  { name: "image-rotate", description: "Rotate image by specified degrees", args: [
    { name: "input", type: "string", required: true, description: "Input image path" },
    { name: "degrees", type: "number", required: true, description: "Rotation angle" },
  ], returnType: "object", group: "image" },

  // Format conversion
  { name: "export-convert", description: "Convert image between formats (PNG, JPEG, WebP, etc.)", args: [
    { name: "input", type: "string", required: true, description: "Input image path" },
    { name: "format", type: "string", required: true, description: "Target format" },
    { name: "quality", type: "integer", required: false, description: "JPEG quality 1-100" },
    { name: "output", type: "string", required: false, description: "Output path" },
  ], returnType: "object", group: "export" },

  // Filters
  { name: "filter-blur", description: "Apply Gaussian blur filter", args: [
    { name: "input", type: "string", required: true, description: "Input image path" },
    { name: "radius", type: "number", required: false, description: "Blur radius" },
  ], returnType: "object", group: "filter" },
  { name: "filter-sharpen", description: "Apply sharpen filter", args: [
    { name: "input", type: "string", required: true, description: "Input image path" },
  ], returnType: "object", group: "filter" },
  { name: "filter-grayscale", description: "Convert image to grayscale", args: [
    { name: "input", type: "string", required: true, description: "Input image path" },
  ], returnType: "object", group: "filter" },
  { name: "filter-invert", description: "Invert image colors", args: [
    { name: "input", type: "string", required: true, description: "Input image path" },
  ], returnType: "object", group: "filter" },
  { name: "filter-edge-detect", description: "Apply edge detection filter", args: [
    { name: "input", type: "string", required: true, description: "Input image path" },
  ], returnType: "object", group: "filter" },

  // Batch operations
  { name: "batch-process", description: "Batch process images in a directory", args: [
    { name: "input-dir", type: "string", required: true, description: "Input directory" },
    { name: "output-dir", type: "string", required: false, description: "Output directory" },
    { name: "operation", type: "string", required: true, description: "Operation: grayscale, resize, convert" },
    { name: "format", type: "string", required: false, description: "Output format" },
  ], returnType: "object", group: "batch" },

  // Color operations
  { name: "color-adjust", description: "Adjust brightness, contrast, or saturation", args: [
    { name: "input", type: "string", required: true, description: "Input image path" },
    { name: "brightness", type: "number", required: false, description: "Brightness adjustment" },
    { name: "contrast", type: "number", required: false, description: "Contrast adjustment" },
  ], returnType: "object", group: "color" },
  { name: "color-histogram", description: "Generate color histogram data", args: [
    { name: "input", type: "string", required: true, description: "Input image path" },
  ], returnType: "object", group: "color" },
];

/**
 * Get GIMP-specific API endpoints (overrides generic CRUD generation).
 */
export function getGimpApiSurface(): ApiEndpoint[] {
  return GIMP_API_SURFACE;
}

/**
 * GIMP-specific backend code snippet (Pillow-based).
 */
export const GIMP_BACKEND_SNIPPET = `
    def image_resize(self, input: str = "", width: int = 0, height: int = 0, output: str = "", **kwargs) -> dict:
        \"\"\"Resize an image using Pillow.\"\"\"
        from PIL import Image
        img = Image.open(input)
        orig = img.size
        new_w = width or orig[0]
        new_h = height or orig[1]
        resized = img.resize((new_w, new_h), Image.LANCZOS)
        out = output or input
        resized.save(out)
        return {"input": input, "output": out, "original": list(orig), "resized": [new_w, new_h]}

    def image_info(self, input: str = "", **kwargs) -> dict:
        \"\"\"Get image metadata.\"\"\"
        import os
        from PIL import Image
        img = Image.open(input)
        w, h = img.size
        return {"path": input, "width": w, "height": h, "format": img.format, "mode": img.mode, "size_bytes": os.path.getsize(input)}

    def filter_blur(self, input: str = "", radius: float = 2.0, **kwargs) -> dict:
        \"\"\"Apply Gaussian blur.\"\"\"
        from PIL import Image, ImageFilter
        img = Image.open(input)
        blurred = img.filter(ImageFilter.GaussianBlur(radius=radius))
        blurred.save(input)
        return {"input": input, "filter": "blur", "radius": radius}

    def filter_grayscale(self, input: str = "", **kwargs) -> dict:
        \"\"\"Convert to grayscale.\"\"\"
        from PIL import Image
        img = Image.open(input).convert("L")
        img.save(input)
        return {"input": input, "filter": "grayscale"}

    def export_convert(self, input: str = "", format: str = "png", quality: int = 85, output: str = "", **kwargs) -> dict:
        \"\"\"Convert between image formats.\"\"\"
        import os
        from PIL import Image
        img = Image.open(input)
        fmt = format.upper()
        if fmt == "JPG":
            fmt = "JPEG"
        out = output or f"{os.path.splitext(input)[0]}.{format}"
        save_kwargs = {}
        if fmt == "JPEG":
            save_kwargs["quality"] = quality
            if img.mode == "RGBA":
                img = img.convert("RGB")
        img.save(out, format=fmt, **save_kwargs)
        return {"input": input, "output": out, "format": fmt}
`;
