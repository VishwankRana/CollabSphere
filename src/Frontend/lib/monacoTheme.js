export function applyCodescreenMonacoTheme(monaco) {
  monaco.editor.defineTheme("codescreen-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "8B949E", fontStyle: "italic" },
      { token: "keyword", foreground: "FF7B72" },
      { token: "string", foreground: "A5D6FF" },
      { token: "number", foreground: "79C0FF" },
      { token: "type", foreground: "FFA657" },
      { token: "function", foreground: "D2A8FF" },
      { token: "variable", foreground: "E6EDF3" },
    ],
    colors: {
      "editor.background": "#0D1117",
      "editor.foreground": "#E6EDF3",
      "editor.lineHighlightBackground": "#161B2240",
      "editor.selectionBackground": "#7C6DFA30",
      "editorLineNumber.foreground": "#484F58",
      "editorLineNumber.activeForeground": "#8B949E",
      "editorCursor.foreground": "#7C6DFA",
      "editorIndentGuide.background1": "#21262D",
      "editorGutter.background": "#0D1117",
      "scrollbarSlider.background": "#30363D60",
      "scrollbarSlider.hoverBackground": "#484F5880",
    },
  });

  monaco.editor.setTheme("codescreen-dark");
}
