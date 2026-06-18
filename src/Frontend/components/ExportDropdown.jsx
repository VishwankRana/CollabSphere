import { useEffect, useRef, useState } from "react";

import { exportMarkdown, exportPDF } from "../lib/exportDocument";

export default function ExportDropdown({ editor, editorContainerRef, documentTitle }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (!dropdownRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isOpen]);

  function handleExportMarkdown() {
    exportMarkdown(editor, documentTitle);
    setIsOpen(false);
  }

  async function handleExportPDF() {
    await exportPDF(editorContainerRef?.current, documentTitle);
    setIsOpen(false);
  }

  return (
    <div className="export-dropdown" ref={dropdownRef}>
      <button
        className="toolbar-button export-dropdown-trigger"
        onClick={() => setIsOpen((open) => !open)}
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        Export
      </button>

      {isOpen ? (
        <div className="export-dropdown-menu" role="menu">
          <button
            className="export-dropdown-item"
            onClick={handleExportMarkdown}
            role="menuitem"
            type="button"
          >
            Export as Markdown
          </button>
          <button
            className="export-dropdown-item"
            onClick={handleExportPDF}
            role="menuitem"
            type="button"
          >
            Export as PDF
          </button>
        </div>
      ) : null}
    </div>
  );
}
