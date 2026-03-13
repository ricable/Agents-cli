/**
 * cli-anything/templates/inkscape.ts — Inkscape-specific template overrides.
 *
 * Provides Inkscape-specific API surface and backend methods using
 * subprocess calls to Inkscape CLI and lxml/svgwrite for SVG manipulation.
 */

import type { ApiEndpoint } from "../types.js";

export const INKSCAPE_API_SURFACE: ApiEndpoint[] = [
  // Document
  { name: "document-new", description: "Create a new blank SVG document", args: [
    { name: "width", type: "integer", required: false, description: "Canvas width in pixels (default 800)" },
    { name: "height", type: "integer", required: false, description: "Canvas height in pixels (default 600)" },
    { name: "output", type: "string", required: true, description: "Output SVG file path" },
  ], returnType: "object", group: "document" },
  { name: "document-info", description: "Get SVG document metadata (dimensions, layers, object count)", args: [
    { name: "input", type: "string", required: true, description: "SVG file path" },
  ], returnType: "object", group: "document" },
  { name: "document-set-size", description: "Change the document canvas size", args: [
    { name: "input", type: "string", required: true, description: "SVG file path" },
    { name: "width", type: "integer", required: true, description: "New width in pixels" },
    { name: "height", type: "integer", required: true, description: "New height in pixels" },
  ], returnType: "object", group: "document" },

  // Object
  { name: "object-add-rect", description: "Add a rectangle to the SVG", args: [
    { name: "input", type: "string", required: true, description: "SVG file path" },
    { name: "x", type: "number", required: false, description: "X position" },
    { name: "y", type: "number", required: false, description: "Y position" },
    { name: "width", type: "number", required: true, description: "Rectangle width" },
    { name: "height", type: "number", required: true, description: "Rectangle height" },
    { name: "fill", type: "string", required: false, description: "Fill color (hex)" },
  ], returnType: "object", group: "object" },
  { name: "object-add-circle", description: "Add a circle to the SVG", args: [
    { name: "input", type: "string", required: true, description: "SVG file path" },
    { name: "cx", type: "number", required: true, description: "Center X" },
    { name: "cy", type: "number", required: true, description: "Center Y" },
    { name: "r", type: "number", required: true, description: "Radius" },
    { name: "fill", type: "string", required: false, description: "Fill color" },
  ], returnType: "object", group: "object" },
  { name: "object-list", description: "List all objects in the SVG with their IDs and types", args: [
    { name: "input", type: "string", required: true, description: "SVG file path" },
  ], returnType: "object", group: "object" },
  { name: "object-delete", description: "Delete an SVG element by ID", args: [
    { name: "input", type: "string", required: true, description: "SVG file path" },
    { name: "id", type: "string", required: true, description: "Element ID to delete" },
  ], returnType: "object", group: "object" },

  // Path
  { name: "path-add", description: "Add a custom SVG path element", args: [
    { name: "input", type: "string", required: true, description: "SVG file path" },
    { name: "d", type: "string", required: true, description: "SVG path data string" },
    { name: "stroke", type: "string", required: false, description: "Stroke color" },
    { name: "fill", type: "string", required: false, description: "Fill color" },
  ], returnType: "object", group: "path" },
  { name: "path-object-to-path", description: "Convert a shape object to a path using Inkscape CLI", args: [
    { name: "input", type: "string", required: true, description: "SVG file path" },
    { name: "id", type: "string", required: true, description: "Object ID to convert" },
  ], returnType: "object", group: "path" },

  // Text
  { name: "text-add", description: "Add a text element to the SVG", args: [
    { name: "input", type: "string", required: true, description: "SVG file path" },
    { name: "content", type: "string", required: true, description: "Text content" },
    { name: "x", type: "number", required: false, description: "X position" },
    { name: "y", type: "number", required: false, description: "Y position" },
    { name: "font-size", type: "integer", required: false, description: "Font size in pixels" },
    { name: "font-family", type: "string", required: false, description: "Font family name" },
  ], returnType: "object", group: "text" },

  // Export
  { name: "export-png", description: "Export SVG to PNG using Inkscape CLI", args: [
    { name: "input", type: "string", required: true, description: "SVG file path" },
    { name: "output", type: "string", required: true, description: "Output PNG path" },
    { name: "dpi", type: "integer", required: false, description: "Export DPI (default 96)" },
    { name: "width", type: "integer", required: false, description: "Export width in pixels" },
  ], returnType: "object", group: "export" },
  { name: "export-pdf", description: "Export SVG to PDF using Inkscape CLI", args: [
    { name: "input", type: "string", required: true, description: "SVG file path" },
    { name: "output", type: "string", required: true, description: "Output PDF path" },
  ], returnType: "object", group: "export" },
  { name: "export-eps", description: "Export SVG to EPS format", args: [
    { name: "input", type: "string", required: true, description: "SVG file path" },
    { name: "output", type: "string", required: true, description: "Output EPS path" },
  ], returnType: "object", group: "export" },

  // Transform
  { name: "transform-translate", description: "Move an SVG element by offset", args: [
    { name: "input", type: "string", required: true, description: "SVG file path" },
    { name: "id", type: "string", required: true, description: "Element ID" },
    { name: "dx", type: "number", required: true, description: "X offset" },
    { name: "dy", type: "number", required: true, description: "Y offset" },
  ], returnType: "object", group: "transform" },
  { name: "transform-scale", description: "Scale an SVG element", args: [
    { name: "input", type: "string", required: true, description: "SVG file path" },
    { name: "id", type: "string", required: true, description: "Element ID" },
    { name: "sx", type: "number", required: true, description: "Scale X factor" },
    { name: "sy", type: "number", required: false, description: "Scale Y factor" },
  ], returnType: "object", group: "transform" },
  { name: "transform-rotate", description: "Rotate an SVG element", args: [
    { name: "input", type: "string", required: true, description: "SVG file path" },
    { name: "id", type: "string", required: true, description: "Element ID" },
    { name: "angle", type: "number", required: true, description: "Rotation angle in degrees" },
  ], returnType: "object", group: "transform" },
];

export function getInkscapeApiSurface(): ApiEndpoint[] {
  return INKSCAPE_API_SURFACE;
}

export const INKSCAPE_BACKEND_SNIPPET = `
    def document_new(self, width: int = 800, height: int = 600, output: str = "drawing.svg", **kwargs) -> dict:
        \"\"\"Create a new blank SVG document using lxml.\"\"\"
        from lxml import etree
        SVG_NS = "http://www.w3.org/2000/svg"
        root = etree.Element(f"{{{SVG_NS}}}svg", nsmap={None: SVG_NS})
        root.set("width", str(width))
        root.set("height", str(height))
        root.set("viewBox", f"0 0 {width} {height}")
        tree = etree.ElementTree(root)
        tree.write(output, xml_declaration=True, encoding="utf-8", pretty_print=True)
        return {"output": output, "width": width, "height": height}

    def document_info(self, input: str = "", **kwargs) -> dict:
        \"\"\"Get SVG document metadata.\"\"\"
        from lxml import etree
        tree = etree.parse(input)
        root = tree.getroot()
        ns = {"svg": "http://www.w3.org/2000/svg"}
        elements = root.findall(".//*")
        return {"path": input, "width": root.get("width"), "height": root.get("height"), "elements": len(elements)}

    def object_add_rect(self, input: str = "", x: float = 0, y: float = 0, width: float = 100, height: float = 100, fill: str = "#000000", **kwargs) -> dict:
        \"\"\"Add a rectangle to the SVG.\"\"\"
        from lxml import etree
        import uuid
        tree = etree.parse(input)
        root = tree.getroot()
        ns = "http://www.w3.org/2000/svg"
        rect = etree.SubElement(root, f"{{{ns}}}rect")
        rid = f"rect-{uuid.uuid4().hex[:8]}"
        rect.set("id", rid)
        rect.set("x", str(x)); rect.set("y", str(y))
        rect.set("width", str(width)); rect.set("height", str(height))
        rect.set("fill", fill)
        tree.write(input, xml_declaration=True, encoding="utf-8", pretty_print=True)
        return {"id": rid, "x": x, "y": y, "width": width, "height": height, "fill": fill}

    def object_add_circle(self, input: str = "", cx: float = 100, cy: float = 100, r: float = 50, fill: str = "#000000", **kwargs) -> dict:
        \"\"\"Add a circle to the SVG.\"\"\"
        from lxml import etree
        import uuid
        tree = etree.parse(input)
        root = tree.getroot()
        ns = "http://www.w3.org/2000/svg"
        circle = etree.SubElement(root, f"{{{ns}}}circle")
        cid = f"circle-{uuid.uuid4().hex[:8]}"
        circle.set("id", cid)
        circle.set("cx", str(cx)); circle.set("cy", str(cy)); circle.set("r", str(r))
        circle.set("fill", fill)
        tree.write(input, xml_declaration=True, encoding="utf-8", pretty_print=True)
        return {"id": cid, "cx": cx, "cy": cy, "r": r, "fill": fill}

    def object_list(self, input: str = "", **kwargs) -> dict:
        \"\"\"List all objects in the SVG with IDs and types.\"\"\"
        from lxml import etree
        tree = etree.parse(input)
        root = tree.getroot()
        ns = {"svg": "http://www.w3.org/2000/svg"}
        items = []
        for el in root.iter():
            tag = etree.QName(el).localname
            if tag in ("rect", "circle", "ellipse", "path", "text", "line", "polygon", "polyline", "g"):
                items.append({"id": el.get("id", ""), "type": tag})
        return {"objects": items, "count": len(items)}

    def export_png(self, input: str = "", output: str = "export.png", dpi: int = 96, width: int = 0, **kwargs) -> dict:
        \"\"\"Export SVG to PNG using Inkscape CLI.\"\"\"
        import subprocess
        cmd = ["inkscape", input, "--export-filename", output, f"--export-dpi={dpi}"]
        if width:
            cmd.append(f"--export-width={width}")
        subprocess.run(cmd, check=True, capture_output=True)
        return {"input": input, "output": output, "dpi": dpi}

    def export_pdf(self, input: str = "", output: str = "export.pdf", **kwargs) -> dict:
        \"\"\"Export SVG to PDF using Inkscape CLI.\"\"\"
        import subprocess
        subprocess.run(["inkscape", input, "--export-filename", output], check=True, capture_output=True)
        return {"input": input, "output": output, "format": "PDF"}

    def transform_translate(self, input: str = "", id: str = "", dx: float = 0, dy: float = 0, **kwargs) -> dict:
        \"\"\"Move an SVG element by offset.\"\"\"
        from lxml import etree
        tree = etree.parse(input)
        root = tree.getroot()
        el = root.xpath(f"//*[@id='{id}']")
        if not el:
            return {"error": f"Element '{id}' not found"}
        el = el[0]
        existing = el.get("transform", "")
        el.set("transform", f"{existing} translate({dx},{dy})".strip())
        tree.write(input, xml_declaration=True, encoding="utf-8", pretty_print=True)
        return {"id": id, "dx": dx, "dy": dy}

    def transform_rotate(self, input: str = "", id: str = "", angle: float = 0, **kwargs) -> dict:
        \"\"\"Rotate an SVG element.\"\"\"
        from lxml import etree
        tree = etree.parse(input)
        root = tree.getroot()
        el = root.xpath(f"//*[@id='{id}']")
        if not el:
            return {"error": f"Element '{id}' not found"}
        el = el[0]
        existing = el.get("transform", "")
        el.set("transform", f"{existing} rotate({angle})".strip())
        tree.write(input, xml_declaration=True, encoding="utf-8", pretty_print=True)
        return {"id": id, "angle": angle}
`;
