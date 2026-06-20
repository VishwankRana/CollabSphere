import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";
import Editor from "@monaco-editor/react";
import { MonacoBinding } from "y-monaco";

import { createInterviewProvider } from "../yjs/interviewProvider";
import {
  getAwarenessColor,
  getStarterCodeForLanguage,
  isStarterOrEmpty,
  MONACO_LANGUAGE_IDS,
} from "../lib/interview";
import { applyCodescreenMonacoTheme } from "../lib/monacoTheme";

const CollaborativeCodeEditor = forwardRef(function CollaborativeCodeEditor(
  {
    roomId,
    language = "javascript",
    readOnly = false,
    userName = "Guest",
    userRole = "candidate",
    starterCode = {},
    onEditorMount,
  },
  ref
) {
  const ydocRef = useRef(null);
  const providerRef = useRef(null);
  const indexeddbProviderRef = useRef(null);
  const bindingRef = useRef(null);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const starterAppliedRef = useRef(false);
  const previousLanguageRef = useRef(language);
  const starterCodeRef = useRef(starterCode);

  useEffect(() => {
    starterCodeRef.current = starterCode;
  }, [starterCode]);

  useEffect(() => {
    starterAppliedRef.current = false;

    const { provider, ydoc, indexeddbProvider } = createInterviewProvider(roomId);
    ydocRef.current = ydoc;
    providerRef.current = provider;
    indexeddbProviderRef.current = indexeddbProvider;

    provider.awareness.setLocalStateField("user", {
      name: userName,
      color: getAwarenessColor(userRole),
      role: userRole,
    });

    return () => {
      bindingRef.current?.destroy();
      bindingRef.current = null;
      indexeddbProvider.destroy();
      provider.destroy();
      ydoc.destroy();
      ydocRef.current = null;
      providerRef.current = null;
      indexeddbProviderRef.current = null;
      editorRef.current = null;
    };
  }, [roomId, userName, userRole]);

  useEffect(() => {
    providerRef.current?.awareness.setLocalStateField("user", {
      name: userName,
      color: getAwarenessColor(userRole),
      role: userRole,
    });
  }, [userName, userRole]);

  useEffect(() => {
    const monaco = monacoRef.current;
    const editor = editorRef.current;
    const ydoc = ydocRef.current;
    const monacoLanguage = MONACO_LANGUAGE_IDS[language] || "javascript";
    const languageChanged = previousLanguageRef.current !== language;

    if (monaco && editor) {
      const model = editor.getModel();

      if (model) {
        monaco.editor.setModelLanguage(model, monacoLanguage);
      }
    }

    if (languageChanged && ydoc) {
      const yText = ydoc.getText("code");
      const currentCode = yText.toString();

      if (isStarterOrEmpty(currentCode, starterCodeRef.current)) {
        const template = getStarterCodeForLanguage(language, starterCodeRef.current);

        ydoc.transact(() => {
          if (yText.length > 0) {
            yText.delete(0, yText.length);
          }

          if (template) {
            yText.insert(0, template);
          }
        });
      }
    }

    previousLanguageRef.current = language;
  }, [language]);

  useImperativeHandle(ref, () => ({
    getCode: () => ydocRef.current?.getText("code").toString() || "",
  }));

  const seedStarterCode = useCallback(() => {
    const ydoc = ydocRef.current;

    if (!ydoc || starterAppliedRef.current) {
      return;
    }

    const yText = ydoc.getText("code");
    const template = getStarterCodeForLanguage(language, starterCode);

    if (yText.length === 0 && template) {
      yText.insert(0, template);
    }

    starterAppliedRef.current = true;
  }, [language, starterCode]);

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    applyCodescreenMonacoTheme(monaco);

    bindingRef.current?.destroy();

    const ydoc = ydocRef.current;
    const provider = providerRef.current;

    if (!ydoc || !provider) {
      return;
    }

    const yText = ydoc.getText("code");
    const model = editor.getModel();

    if (!model) {
      return;
    }

    seedStarterCode();

    bindingRef.current = new MonacoBinding(
      yText,
      model,
      new Set([editor]),
      provider.awareness
    );

    onEditorMount?.(editor, monaco);
  };

  return (
    <div className="collaborative-code-editor">
      <Editor
        height="100%"
        language={MONACO_LANGUAGE_IDS[language] || "javascript"}
        onMount={handleEditorMount}
        options={{
          readOnly,
          fontSize: 14,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: "on",
          lineNumbers: "on",
          tabSize: 2,
          automaticLayout: true,
        }}
        theme="codescreen-dark"
      />
    </div>
  );
});

export default CollaborativeCodeEditor;
