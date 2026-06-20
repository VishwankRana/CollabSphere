const STYLE_ID = "monaco-awareness-cursor-styles";

function escapeCssString(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/\n/g, " ");
}

export function syncMonacoAwarenessCursors(awareness) {
  let styleEl = document.getElementById(STYLE_ID);

  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = STYLE_ID;
    document.head.appendChild(styleEl);
  }

  const rules = [];

  awareness.getStates().forEach((state, clientId) => {
    if (clientId === awareness.clientID) {
      return;
    }

    const user = state?.user;

    if (!user?.color) {
      return;
    }

    const name = escapeCssString(user.name || "User");
    const color = user.color;

    rules.push(`
      .monaco-editor .yRemoteSelectionHead-${clientId} {
        border-left: 2px solid ${color};
        border-top: 2px solid ${color};
        border-bottom: 2px solid ${color};
        position: relative;
      }

      .monaco-editor .yRemoteSelectionHead-${clientId}::after {
        content: '${name}';
        position: absolute;
        top: -1.35em;
        left: -1px;
        padding: 1px 6px;
        border-radius: 3px 3px 3px 0;
        font-size: 10px;
        font-family: "Inter", sans-serif;
        font-weight: 600;
        line-height: 1.35;
        color: #fff;
        background-color: ${color};
        white-space: nowrap;
        pointer-events: none;
        z-index: 10;
      }

      .monaco-editor .yRemoteSelection-${clientId} {
        background-color: ${color};
        opacity: 0.22;
      }
    `);
  });

  styleEl.textContent = rules.join("\n");
}

export function attachMonacoAwarenessCursors(awareness) {
  const handleUpdate = () => {
    syncMonacoAwarenessCursors(awareness);
  };

  awareness.on("update", handleUpdate);
  handleUpdate();

  return () => {
    awareness.off("update", handleUpdate);
    const styleEl = document.getElementById(STYLE_ID);

    if (styleEl) {
      styleEl.textContent = "";
    }
  };
}
