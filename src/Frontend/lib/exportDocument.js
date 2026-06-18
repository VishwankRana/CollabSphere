import html2pdf from "html2pdf.js";

function sanitizeFilename(title) {
  const safeTitle = (title || "document")
    .trim()
    .replace(/[<>:"/\\|?*]+/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 120);

  return safeTitle || "document";
}

export function exportMarkdown(editor, documentTitle) {
  if (!editor) {
    return;
  }

  const markdown =
    typeof editor.getMarkdown === "function"
      ? editor.getMarkdown()
      : editor.storage?.markdown?.getMarkdown?.() ?? "";

  const blob = new Blob([markdown], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${sanitizeFilename(documentTitle)}.md`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function exportPDF(editorContainer, documentTitle) {
  if (!editorContainer) {
    return;
  }

  const element = editorContainer.querySelector(".ProseMirror");

  if (!element) {
    return;
  }

  editorContainer.classList.add("exporting");

  const options = {
    margin: [15, 15, 15, 15],
    filename: `${sanitizeFilename(documentTitle)}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
  };

  try {
    await html2pdf().set(options).from(element).save();
  } finally {
    editorContainer.classList.remove("exporting");
  }
}
