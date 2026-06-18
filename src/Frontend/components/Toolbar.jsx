import { useEffect, useState } from "react";

export default function Toolbar({ editor, disabled = false }) {
  const [, setVersion] = useState(0);

  useEffect(() => {
    if (!editor) return undefined;

    const rerender = () => {
      setVersion((value) => value + 1);
    };

    editor.on("transaction", rerender);
    editor.on("selectionUpdate", rerender);
    editor.on("update", rerender);

    return () => {
      editor.off("transaction", rerender);
      editor.off("selectionUpdate", rerender);
      editor.off("update", rerender);
    };
  }, [editor]);

  if (!editor) return null;

  const buttons = [
    {
      label: "Bold",
      action: () => editor.chain().focus().toggleBold().run(),
      active: editor.isActive("bold"),
    },
    {
      label: "Italic",
      action: () => editor.chain().focus().toggleItalic().run(),
      active: editor.isActive("italic"),
    },
    {
      label: "H1",
      action: () => editor.chain().focus().toggleInlineHeading({ level: 1 }).run(),
      active: editor.isActive("inlineHeading", { level: 1 }),
    },
    {
      label: "H2",
      action: () => editor.chain().focus().toggleInlineHeading({ level: 2 }).run(),
      active: editor.isActive("inlineHeading", { level: 2 }),
    },
    {
      label: "List",
      action: () => editor.chain().focus().toggleBulletList().run(),
      active: editor.isActive("bulletList"),
    },
  ];

  return (
    <div className="toolbar">
      {buttons.map((button) => (
        <button
          key={button.label}
          className={button.active ? "toolbar-button active" : "toolbar-button"}
          disabled={disabled}
          onClick={button.action}
          type="button"
        >
          {button.label}
        </button>
      ))}
    </div>
  );
}
