/**
 * cli-anything/templates/libreoffice.ts — LibreOffice-specific template overrides.
 *
 * Provides LibreOffice-specific API surface and backend methods using
 * python-docx, openpyxl, python-pptx, and headless LibreOffice subprocess.
 */

import type { ApiEndpoint } from "../types.js";

export const LIBREOFFICE_API_SURFACE: ApiEndpoint[] = [
  // Document (Writer)
  { name: "document-create", description: "Create a new Word document", args: [
    { name: "output", type: "string", required: true, description: "Output .docx file path" },
    { name: "title", type: "string", required: false, description: "Document title" },
  ], returnType: "object", group: "document" },
  { name: "document-add-paragraph", description: "Add a paragraph to a Word document", args: [
    { name: "input", type: "string", required: true, description: "Document path" },
    { name: "text", type: "string", required: true, description: "Paragraph text" },
    { name: "style", type: "string", required: false, description: "Style name (e.g. Heading 1, Normal)" },
  ], returnType: "object", group: "document" },
  { name: "document-add-table", description: "Add a table to a Word document", args: [
    { name: "input", type: "string", required: true, description: "Document path" },
    { name: "rows", type: "integer", required: true, description: "Number of rows" },
    { name: "cols", type: "integer", required: true, description: "Number of columns" },
    { name: "data", type: "string", required: false, description: "CSV data to populate table" },
  ], returnType: "object", group: "document" },
  { name: "document-read", description: "Read all text from a Word document", args: [
    { name: "input", type: "string", required: true, description: "Document path" },
  ], returnType: "object", group: "document" },

  // Spreadsheet (Calc)
  { name: "spreadsheet-create", description: "Create a new Excel spreadsheet", args: [
    { name: "output", type: "string", required: true, description: "Output .xlsx file path" },
    { name: "sheet-name", type: "string", required: false, description: "Initial sheet name" },
  ], returnType: "object", group: "spreadsheet" },
  { name: "spreadsheet-read-cells", description: "Read cell values from a range", args: [
    { name: "input", type: "string", required: true, description: "Spreadsheet path" },
    { name: "sheet", type: "string", required: false, description: "Sheet name" },
    { name: "range", type: "string", required: true, description: "Cell range (e.g. A1:C10)" },
  ], returnType: "object", group: "spreadsheet" },
  { name: "spreadsheet-write-cells", description: "Write values to cells", args: [
    { name: "input", type: "string", required: true, description: "Spreadsheet path" },
    { name: "sheet", type: "string", required: false, description: "Sheet name" },
    { name: "cell", type: "string", required: true, description: "Starting cell (e.g. A1)" },
    { name: "data", type: "string", required: true, description: "CSV data to write" },
  ], returnType: "object", group: "spreadsheet" },
  { name: "spreadsheet-list-sheets", description: "List all sheet names in a workbook", args: [
    { name: "input", type: "string", required: true, description: "Spreadsheet path" },
  ], returnType: "object", group: "spreadsheet" },
  { name: "spreadsheet-add-sheet", description: "Add a new sheet to a workbook", args: [
    { name: "input", type: "string", required: true, description: "Spreadsheet path" },
    { name: "name", type: "string", required: true, description: "New sheet name" },
  ], returnType: "object", group: "spreadsheet" },

  // Presentation (Impress)
  { name: "presentation-create", description: "Create a new PowerPoint presentation", args: [
    { name: "output", type: "string", required: true, description: "Output .pptx file path" },
  ], returnType: "object", group: "presentation" },
  { name: "presentation-add-slide", description: "Add a slide to a presentation", args: [
    { name: "input", type: "string", required: true, description: "Presentation path" },
    { name: "title", type: "string", required: false, description: "Slide title" },
    { name: "content", type: "string", required: false, description: "Slide body text" },
    { name: "layout", type: "integer", required: false, description: "Slide layout index (0-8)" },
  ], returnType: "object", group: "presentation" },
  { name: "presentation-list-slides", description: "List all slides with titles", args: [
    { name: "input", type: "string", required: true, description: "Presentation path" },
  ], returnType: "object", group: "presentation" },

  // Convert
  { name: "convert-to-pdf", description: "Convert document to PDF using headless LibreOffice", args: [
    { name: "input", type: "string", required: true, description: "Input file path (docx, xlsx, pptx, odt)" },
    { name: "output-dir", type: "string", required: false, description: "Output directory" },
  ], returnType: "object", group: "convert" },
  { name: "convert-format", description: "Convert between office formats", args: [
    { name: "input", type: "string", required: true, description: "Input file path" },
    { name: "format", type: "string", required: true, description: "Target format (pdf, docx, odt, xlsx, csv, html)" },
    { name: "output-dir", type: "string", required: false, description: "Output directory" },
  ], returnType: "object", group: "convert" },

  // Template
  { name: "template-fill", description: "Fill a document template with key-value data", args: [
    { name: "template", type: "string", required: true, description: "Template document path" },
    { name: "data", type: "string", required: true, description: "JSON key-value pairs for placeholders" },
    { name: "output", type: "string", required: true, description: "Output file path" },
  ], returnType: "object", group: "template" },
  { name: "template-list-placeholders", description: "List all placeholders in a template document", args: [
    { name: "input", type: "string", required: true, description: "Template document path" },
  ], returnType: "object", group: "template" },
];

export function getLibreofficeApiSurface(): ApiEndpoint[] {
  return LIBREOFFICE_API_SURFACE;
}

export const LIBREOFFICE_BACKEND_SNIPPET = `
    def document_create(self, output: str = "document.docx", title: str = "", **kwargs) -> dict:
        \"\"\"Create a new Word document using python-docx.\"\"\"
        from docx import Document
        doc = Document()
        if title:
            doc.add_heading(title, level=0)
        doc.save(output)
        return {"output": output, "title": title}

    def document_add_paragraph(self, input: str = "", text: str = "", style: str = "Normal", **kwargs) -> dict:
        \"\"\"Add a paragraph to a Word document.\"\"\"
        from docx import Document
        doc = Document(input)
        doc.add_paragraph(text, style=style)
        doc.save(input)
        return {"input": input, "text": text[:50], "style": style, "paragraphs": len(doc.paragraphs)}

    def document_add_table(self, input: str = "", rows: int = 2, cols: int = 2, data: str = "", **kwargs) -> dict:
        \"\"\"Add a table to a Word document.\"\"\"
        from docx import Document
        doc = Document(input)
        table = doc.add_table(rows=rows, cols=cols)
        if data:
            csv_rows = [r.split(",") for r in data.strip().split("\\n")]
            for i, row in enumerate(csv_rows[:rows]):
                for j, val in enumerate(row[:cols]):
                    table.cell(i, j).text = val.strip()
        doc.save(input)
        return {"input": input, "rows": rows, "cols": cols}

    def document_read(self, input: str = "", **kwargs) -> dict:
        \"\"\"Read all text from a Word document.\"\"\"
        from docx import Document
        doc = Document(input)
        paragraphs = [p.text for p in doc.paragraphs]
        return {"input": input, "paragraphs": len(paragraphs), "text": "\\n".join(paragraphs)}

    def spreadsheet_create(self, output: str = "sheet.xlsx", sheet_name: str = "Sheet1", **kwargs) -> dict:
        \"\"\"Create a new Excel spreadsheet using openpyxl.\"\"\"
        from openpyxl import Workbook
        wb = Workbook()
        ws = wb.active
        ws.title = sheet_name
        wb.save(output)
        return {"output": output, "sheet": sheet_name}

    def spreadsheet_read_cells(self, input: str = "", sheet: str = "", range: str = "A1:A1", **kwargs) -> dict:
        \"\"\"Read cell values from a range.\"\"\"
        from openpyxl import load_workbook
        wb = load_workbook(input, data_only=True)
        ws = wb[sheet] if sheet else wb.active
        rows = []
        for row in ws[range]:
            rows.append([cell.value for cell in row])
        return {"input": input, "sheet": ws.title, "range": range, "data": rows}

    def spreadsheet_write_cells(self, input: str = "", sheet: str = "", cell: str = "A1", data: str = "", **kwargs) -> dict:
        \"\"\"Write values to cells.\"\"\"
        from openpyxl import load_workbook
        from openpyxl.utils import coordinate_from_string, column_index_from_string
        wb = load_workbook(input)
        ws = wb[sheet] if sheet else wb.active
        col_letter, start_row = coordinate_from_string(cell)
        start_col = column_index_from_string(col_letter)
        csv_rows = [r.split(",") for r in data.strip().split("\\n")]
        for ri, row in enumerate(csv_rows):
            for ci, val in enumerate(row):
                ws.cell(row=start_row + ri, column=start_col + ci, value=val.strip())
        wb.save(input)
        return {"input": input, "sheet": ws.title, "start_cell": cell, "rows_written": len(csv_rows)}

    def spreadsheet_list_sheets(self, input: str = "", **kwargs) -> dict:
        \"\"\"List all sheet names in a workbook.\"\"\"
        from openpyxl import load_workbook
        wb = load_workbook(input, read_only=True)
        return {"input": input, "sheets": wb.sheetnames, "count": len(wb.sheetnames)}

    def presentation_create(self, output: str = "presentation.pptx", **kwargs) -> dict:
        \"\"\"Create a new PowerPoint presentation using python-pptx.\"\"\"
        from pptx import Presentation
        prs = Presentation()
        prs.save(output)
        return {"output": output, "slides": 0}

    def presentation_add_slide(self, input: str = "", title: str = "", content: str = "", layout: int = 1, **kwargs) -> dict:
        \"\"\"Add a slide to a presentation.\"\"\"
        from pptx import Presentation
        from pptx.util import Inches
        prs = Presentation(input)
        slide_layout = prs.slide_layouts[layout]
        slide = prs.slides.add_slide(slide_layout)
        if title and slide.shapes.title:
            slide.shapes.title.text = title
        if content and len(slide.placeholders) > 1:
            slide.placeholders[1].text = content
        prs.save(input)
        return {"input": input, "title": title, "slides": len(prs.slides)}

    def convert_to_pdf(self, input: str = "", output_dir: str = ".", **kwargs) -> dict:
        \"\"\"Convert document to PDF using headless LibreOffice.\"\"\"
        import subprocess, os
        subprocess.run([
            "soffice", "--headless", "--convert-to", "pdf", "--outdir", output_dir, input
        ], check=True, capture_output=True)
        base = os.path.splitext(os.path.basename(input))[0]
        output = os.path.join(output_dir, f"{base}.pdf")
        return {"input": input, "output": output, "format": "pdf"}

    def convert_format(self, input: str = "", format: str = "pdf", output_dir: str = ".", **kwargs) -> dict:
        \"\"\"Convert between office formats using headless LibreOffice.\"\"\"
        import subprocess, os
        subprocess.run([
            "soffice", "--headless", "--convert-to", format, "--outdir", output_dir, input
        ], check=True, capture_output=True)
        base = os.path.splitext(os.path.basename(input))[0]
        output = os.path.join(output_dir, f"{base}.{format}")
        return {"input": input, "output": output, "format": format}

    def template_fill(self, template: str = "", data: str = "{}", output: str = "", **kwargs) -> dict:
        \"\"\"Fill a document template with key-value data.\"\"\"
        import json
        from docx import Document
        doc = Document(template)
        replacements = json.loads(data)
        for para in doc.paragraphs:
            for key, val in replacements.items():
                if f"{{{{{key}}}}}" in para.text:
                    para.text = para.text.replace(f"{{{{{key}}}}}", str(val))
        doc.save(output)
        return {"template": template, "output": output, "replacements": len(replacements)}
`;
