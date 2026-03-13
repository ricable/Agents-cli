/**
 * cli-anything/templates/drawio.ts — Draw.io-specific template overrides.
 *
 * Provides Draw.io-specific API surface and backend methods using
 * mxGraph XML manipulation via lxml for diagram creation and editing.
 */

import type { ApiEndpoint } from "../types.js";

export const DRAWIO_API_SURFACE: ApiEndpoint[] = [
  // Diagram
  { name: "diagram-new", description: "Create a new empty Draw.io diagram", args: [
    { name: "output", type: "string", required: true, description: "Output .drawio file path" },
    { name: "name", type: "string", required: false, description: "Diagram name" },
  ], returnType: "object", group: "diagram" },
  { name: "diagram-info", description: "Get diagram metadata (pages, shape count, connections)", args: [
    { name: "input", type: "string", required: true, description: "Draw.io file path" },
  ], returnType: "object", group: "diagram" },
  { name: "diagram-add-page", description: "Add a new page/tab to the diagram", args: [
    { name: "input", type: "string", required: true, description: "Draw.io file path" },
    { name: "name", type: "string", required: true, description: "Page name" },
  ], returnType: "object", group: "diagram" },
  { name: "diagram-list-pages", description: "List all pages in the diagram", args: [
    { name: "input", type: "string", required: true, description: "Draw.io file path" },
  ], returnType: "object", group: "diagram" },

  // Shape
  { name: "shape-add-rect", description: "Add a rectangle shape to the diagram", args: [
    { name: "input", type: "string", required: true, description: "Draw.io file path" },
    { name: "label", type: "string", required: true, description: "Shape label text" },
    { name: "x", type: "integer", required: false, description: "X position" },
    { name: "y", type: "integer", required: false, description: "Y position" },
    { name: "width", type: "integer", required: false, description: "Width (default 120)" },
    { name: "height", type: "integer", required: false, description: "Height (default 60)" },
    { name: "fill", type: "string", required: false, description: "Fill color (hex)" },
  ], returnType: "object", group: "shape" },
  { name: "shape-add-ellipse", description: "Add an ellipse/circle shape", args: [
    { name: "input", type: "string", required: true, description: "Draw.io file path" },
    { name: "label", type: "string", required: true, description: "Shape label text" },
    { name: "x", type: "integer", required: false, description: "X position" },
    { name: "y", type: "integer", required: false, description: "Y position" },
    { name: "width", type: "integer", required: false, description: "Width" },
    { name: "height", type: "integer", required: false, description: "Height" },
  ], returnType: "object", group: "shape" },
  { name: "shape-add-diamond", description: "Add a diamond/decision shape", args: [
    { name: "input", type: "string", required: true, description: "Draw.io file path" },
    { name: "label", type: "string", required: true, description: "Shape label text" },
    { name: "x", type: "integer", required: false, description: "X position" },
    { name: "y", type: "integer", required: false, description: "Y position" },
  ], returnType: "object", group: "shape" },
  { name: "shape-list", description: "List all shapes in the diagram", args: [
    { name: "input", type: "string", required: true, description: "Draw.io file path" },
    { name: "page", type: "integer", required: false, description: "Page index (default 0)" },
  ], returnType: "object", group: "shape" },
  { name: "shape-delete", description: "Delete a shape by ID", args: [
    { name: "input", type: "string", required: true, description: "Draw.io file path" },
    { name: "id", type: "string", required: true, description: "Shape cell ID" },
  ], returnType: "object", group: "shape" },
  { name: "shape-update-label", description: "Update the label text of a shape", args: [
    { name: "input", type: "string", required: true, description: "Draw.io file path" },
    { name: "id", type: "string", required: true, description: "Shape cell ID" },
    { name: "label", type: "string", required: true, description: "New label text" },
  ], returnType: "object", group: "shape" },

  // Connection
  { name: "connection-add", description: "Add an arrow/edge between two shapes", args: [
    { name: "input", type: "string", required: true, description: "Draw.io file path" },
    { name: "source", type: "string", required: true, description: "Source shape ID" },
    { name: "target", type: "string", required: true, description: "Target shape ID" },
    { name: "label", type: "string", required: false, description: "Edge label text" },
    { name: "style", type: "string", required: false, description: "Edge style (straight, curved, orthogonal)" },
  ], returnType: "object", group: "connection" },
  { name: "connection-list", description: "List all connections/edges in the diagram", args: [
    { name: "input", type: "string", required: true, description: "Draw.io file path" },
  ], returnType: "object", group: "connection" },

  // Export
  { name: "export-svg", description: "Export diagram to SVG using Draw.io CLI", args: [
    { name: "input", type: "string", required: true, description: "Draw.io file path" },
    { name: "output", type: "string", required: true, description: "Output SVG path" },
    { name: "page", type: "integer", required: false, description: "Page index to export" },
  ], returnType: "object", group: "export" },
  { name: "export-png", description: "Export diagram to PNG", args: [
    { name: "input", type: "string", required: true, description: "Draw.io file path" },
    { name: "output", type: "string", required: true, description: "Output PNG path" },
    { name: "scale", type: "number", required: false, description: "Scale factor (default 1.0)" },
  ], returnType: "object", group: "export" },
  { name: "export-pdf", description: "Export diagram to PDF", args: [
    { name: "input", type: "string", required: true, description: "Draw.io file path" },
    { name: "output", type: "string", required: true, description: "Output PDF path" },
  ], returnType: "object", group: "export" },

  // Style
  { name: "style-set", description: "Set the style of a shape or edge", args: [
    { name: "input", type: "string", required: true, description: "Draw.io file path" },
    { name: "id", type: "string", required: true, description: "Cell ID" },
    { name: "fill", type: "string", required: false, description: "Fill color (hex)" },
    { name: "stroke", type: "string", required: false, description: "Stroke color (hex)" },
    { name: "font-size", type: "integer", required: false, description: "Font size" },
  ], returnType: "object", group: "style" },
  { name: "style-set-theme", description: "Apply a color theme to all shapes", args: [
    { name: "input", type: "string", required: true, description: "Draw.io file path" },
    { name: "theme", type: "string", required: true, description: "Theme name (blue, dark, minimal, sketch)" },
  ], returnType: "object", group: "style" },
];

export function getDrawioApiSurface(): ApiEndpoint[] {
  return DRAWIO_API_SURFACE;
}

export const DRAWIO_BACKEND_SNIPPET = `
    def _next_id(self, root):
        \"\"\"Get next available cell ID.\"\"\"
        max_id = 1
        for cell in root.iter("mxCell"):
            cid = cell.get("id", "0")
            if cid.isdigit():
                max_id = max(max_id, int(cid))
        return str(max_id + 1)

    def diagram_new(self, output: str = "diagram.drawio", name: str = "Page-1", **kwargs) -> dict:
        \"\"\"Create a new empty Draw.io diagram (mxGraph XML).\"\"\"
        from lxml import etree
        mxfile = etree.Element("mxfile")
        diagram = etree.SubElement(mxfile, "diagram", id="page0", name=name)
        model = etree.SubElement(diagram, "mxGraphModel")
        root = etree.SubElement(model, "root")
        etree.SubElement(root, "mxCell", id="0")
        etree.SubElement(root, "mxCell", id="1", parent="0")
        tree = etree.ElementTree(mxfile)
        tree.write(output, xml_declaration=True, encoding="utf-8", pretty_print=True)
        return {"output": output, "name": name}

    def diagram_info(self, input: str = "", **kwargs) -> dict:
        \"\"\"Get diagram metadata.\"\"\"
        from lxml import etree
        tree = etree.parse(input)
        root = tree.getroot()
        diagrams = root.findall(".//diagram")
        shapes = 0; edges = 0
        for cell in root.iter("mxCell"):
            if cell.get("vertex") == "1":
                shapes += 1
            if cell.get("edge") == "1":
                edges += 1
        return {"path": input, "pages": len(diagrams), "shapes": shapes, "connections": edges}

    def diagram_add_page(self, input: str = "", name: str = "Page", **kwargs) -> dict:
        \"\"\"Add a new page to the diagram.\"\"\"
        from lxml import etree
        tree = etree.parse(input)
        mxfile = tree.getroot()
        pages = mxfile.findall("diagram")
        page_id = f"page{len(pages)}"
        diagram = etree.SubElement(mxfile, "diagram", id=page_id, name=name)
        model = etree.SubElement(diagram, "mxGraphModel")
        root = etree.SubElement(model, "root")
        etree.SubElement(root, "mxCell", id="0")
        etree.SubElement(root, "mxCell", id="1", parent="0")
        tree.write(input, xml_declaration=True, encoding="utf-8", pretty_print=True)
        return {"input": input, "page": name, "page_id": page_id}

    def shape_add_rect(self, input: str = "", label: str = "", x: int = 100, y: int = 100, width: int = 120, height: int = 60, fill: str = "#ffffff", **kwargs) -> dict:
        \"\"\"Add a rectangle shape to the diagram.\"\"\"
        from lxml import etree
        tree = etree.parse(input)
        mxfile = tree.getroot()
        mx_root = mxfile.find(".//root")
        cell_id = self._next_id(mxfile)
        style = f"rounded=1;whiteSpace=wrap;html=1;fillColor={fill};"
        cell = etree.SubElement(mx_root, "mxCell", id=cell_id, value=label, style=style, vertex="1", parent="1")
        etree.SubElement(cell, "mxGeometry", x=str(x), y=str(y), width=str(width), height=str(height))
        cell.find("mxGeometry").set("as", "geometry")
        tree.write(input, xml_declaration=True, encoding="utf-8", pretty_print=True)
        return {"id": cell_id, "label": label, "x": x, "y": y, "width": width, "height": height}

    def shape_add_ellipse(self, input: str = "", label: str = "", x: int = 100, y: int = 100, width: int = 80, height: int = 80, **kwargs) -> dict:
        \"\"\"Add an ellipse shape.\"\"\"
        from lxml import etree
        tree = etree.parse(input)
        mxfile = tree.getroot()
        mx_root = mxfile.find(".//root")
        cell_id = self._next_id(mxfile)
        style = "ellipse;whiteSpace=wrap;html=1;"
        cell = etree.SubElement(mx_root, "mxCell", id=cell_id, value=label, style=style, vertex="1", parent="1")
        etree.SubElement(cell, "mxGeometry", x=str(x), y=str(y), width=str(width), height=str(height))
        cell.find("mxGeometry").set("as", "geometry")
        tree.write(input, xml_declaration=True, encoding="utf-8", pretty_print=True)
        return {"id": cell_id, "label": label}

    def shape_add_diamond(self, input: str = "", label: str = "", x: int = 100, y: int = 100, **kwargs) -> dict:
        \"\"\"Add a diamond/decision shape.\"\"\"
        from lxml import etree
        tree = etree.parse(input)
        mxfile = tree.getroot()
        mx_root = mxfile.find(".//root")
        cell_id = self._next_id(mxfile)
        style = "rhombus;whiteSpace=wrap;html=1;"
        cell = etree.SubElement(mx_root, "mxCell", id=cell_id, value=label, style=style, vertex="1", parent="1")
        etree.SubElement(cell, "mxGeometry", x=str(x), y=str(y), width="80", height="80")
        cell.find("mxGeometry").set("as", "geometry")
        tree.write(input, xml_declaration=True, encoding="utf-8", pretty_print=True)
        return {"id": cell_id, "label": label}

    def shape_list(self, input: str = "", page: int = 0, **kwargs) -> dict:
        \"\"\"List all shapes in the diagram.\"\"\"
        from lxml import etree
        tree = etree.parse(input)
        mxfile = tree.getroot()
        diagrams = mxfile.findall("diagram")
        target = diagrams[page] if page < len(diagrams) else diagrams[0]
        shapes = []
        for cell in target.iter("mxCell"):
            if cell.get("vertex") == "1":
                geo = cell.find("mxGeometry")
                shapes.append({
                    "id": cell.get("id"), "label": cell.get("value", ""),
                    "x": geo.get("x") if geo is not None else None,
                    "y": geo.get("y") if geo is not None else None,
                })
        return {"shapes": shapes, "count": len(shapes)}

    def connection_add(self, input: str = "", source: str = "", target: str = "", label: str = "", style: str = "straight", **kwargs) -> dict:
        \"\"\"Add an arrow/edge between two shapes.\"\"\"
        from lxml import etree
        tree = etree.parse(input)
        mxfile = tree.getroot()
        mx_root = mxfile.find(".//root")
        cell_id = self._next_id(mxfile)
        style_map = {"straight": "edgeStyle=none;", "curved": "edgeStyle=elbowEdgeStyle;curved=1;", "orthogonal": "edgeStyle=orthogonalEdgeStyle;"}
        edge_style = style_map.get(style, "edgeStyle=none;") + "html=1;"
        cell = etree.SubElement(mx_root, "mxCell", id=cell_id, value=label, style=edge_style, edge="1", parent="1", source=source, target=target)
        geo = etree.SubElement(cell, "mxGeometry", relative="1")
        geo.set("as", "geometry")
        tree.write(input, xml_declaration=True, encoding="utf-8", pretty_print=True)
        return {"id": cell_id, "source": source, "target": target, "label": label}

    def export_svg(self, input: str = "", output: str = "diagram.svg", page: int = 0, **kwargs) -> dict:
        \"\"\"Export diagram to SVG using Draw.io CLI.\"\"\"
        import subprocess
        cmd = ["drawio", "--export", "--format", "svg", "--page-index", str(page), "--output", output, input]
        subprocess.run(cmd, check=True, capture_output=True)
        return {"input": input, "output": output, "format": "svg", "page": page}

    def export_png(self, input: str = "", output: str = "diagram.png", scale: float = 1.0, **kwargs) -> dict:
        \"\"\"Export diagram to PNG.\"\"\"
        import subprocess
        cmd = ["drawio", "--export", "--format", "png", "--scale", str(scale), "--output", output, input]
        subprocess.run(cmd, check=True, capture_output=True)
        return {"input": input, "output": output, "format": "png", "scale": scale}

    def style_set(self, input: str = "", id: str = "", fill: str = "", stroke: str = "", font_size: int = 0, **kwargs) -> dict:
        \"\"\"Set the style of a shape or edge.\"\"\"
        from lxml import etree
        tree = etree.parse(input)
        mxfile = tree.getroot()
        cell = None
        for c in mxfile.iter("mxCell"):
            if c.get("id") == id:
                cell = c
                break
        if cell is None:
            return {"error": f"Cell '{id}' not found"}
        style = cell.get("style", "")
        if fill:
            style += f"fillColor={fill};"
        if stroke:
            style += f"strokeColor={stroke};"
        if font_size:
            style += f"fontSize={font_size};"
        cell.set("style", style)
        tree.write(input, xml_declaration=True, encoding="utf-8", pretty_print=True)
        return {"id": id, "style": style}
`;
