import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { registerLatexLanguage } from "./monacoLatex";

self.MonacoEnvironment = {
  getWorker() {
    return new editorWorker();
  },
};

registerLatexLanguage(monaco);
loader.config({ monaco });
