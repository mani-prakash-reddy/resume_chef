const LATEX_KEYWORDS = [
  "documentclass",
  "usepackage",
  "begin",
  "end",
  "section",
  "subsection",
  "subsubsection",
  "chapter",
  "paragraph",
  "item",
  "textbf",
  "textit",
  "emph",
  "underline",
  "href",
  "url",
  "includegraphics",
  "caption",
  "label",
  "ref",
  "cite",
  "bibliography",
  "title",
  "author",
  "date",
  "maketitle",
  "tableofcontents",
  "newpage",
  "clearpage",
  "vspace",
  "hspace",
  "newline",
  "linebreak",
  "pagebreak",
  "centering",
  "raggedright",
  "raggedleft",
  "footnote",
  "marginpar",
  "input",
  "include",
];

let configured = false;

export function registerLatexLanguage(monaco) {
  if (configured) return;
  configured = true;

  try {
    const existing = monaco.languages.getLanguages();
    if (!existing.some((l) => l.id === "latex")) {
      monaco.languages.register({ id: "latex", extensions: [".tex", ".latex"] });
    }

    monaco.languages.setMonarchTokensProvider("latex", {
      defaultToken: "text",
      tokenPostfix: ".latex",
      keywords: LATEX_KEYWORDS,
      tokenizer: {
        root: [
          [
            /\\[a-zA-Z]+/,
            { cases: { "@keywords": "keyword.command", "@default": "keyword" } },
          ],
          [/\\[^a-zA-Z\s]/, "keyword.symbol"],
          [/%.*$/, "comment"],
          [/\$\$/, { token: "delimiter.math", next: "@displaymath" }],
          [/\$/, { token: "delimiter.math", next: "@inlinemath" }],
          [/\\begin\{[^}]*\}/, "keyword.environment"],
          [/\\end\{[^}]*\}/, "keyword.environment"],
          [/\{/, { token: "delimiter.bracket", next: "@braces" }],
          [/\[/, { token: "delimiter.square", next: "@bracket" }],
          [/[0-9]+(?:\.[0-9]+)?/, "number"],
          [/[{}[\]]/, "delimiter"],
        ],
        braces: [
          [/\\[a-zA-Z]+/, "keyword"],
          [/[{}]/, { token: "delimiter.bracket", next: "@pop" }],
          [/./, "string"],
        ],
        bracket: [
          [/\]/, { token: "delimiter.square", next: "@pop" }],
          [/./, "attribute"],
        ],
        inlinemath: [
          [/\\[a-zA-Z]+/, "keyword.math"],
          [/\$/, { token: "delimiter.math", next: "@pop" }],
          [/./, "number.math"],
        ],
        displaymath: [
          [/\\[a-zA-Z]+/, "keyword.math"],
          [/\$\$/, { token: "delimiter.math", next: "@pop" }],
          [/./, "number.math"],
        ],
      },
    });

    monaco.languages.setLanguageConfiguration("latex", {
      comments: { lineComment: "%" },
      brackets: [
        ["{", "}"],
        ["[", "]"],
        ["(", ")"],
      ],
      autoClosingPairs: [
        { open: "{", close: "}" },
        { open: "[", close: "]" },
        { open: "(", close: ")" },
        { open: "$", close: "$" },
      ],
    });

    monaco.editor.defineTheme("resume-chef-light", {
      base: "vs",
      inherit: true,
      rules: [
        { token: "keyword.command", foreground: "004ac6", fontStyle: "bold" },
        { token: "keyword.environment", foreground: "943700", fontStyle: "bold" },
        { token: "keyword", foreground: "2563eb" },
        { token: "keyword.symbol", foreground: "505f76" },
        { token: "keyword.math", foreground: "004ac6" },
        { token: "comment", foreground: "737686", fontStyle: "italic" },
        { token: "string", foreground: "bc4800" },
        { token: "attribute", foreground: "54647a" },
        { token: "number", foreground: "505f76" },
        { token: "number.math", foreground: "004ac6" },
        { token: "delimiter.math", foreground: "943700", fontStyle: "bold" },
        { token: "delimiter.bracket", foreground: "434655" },
      ],
      colors: {
        "editor.background": "#ffffff",
        "editor.foreground": "#1b1b1b",
        "editorLineNumber.foreground": "#737686",
        "editorLineNumber.activeForeground": "#434655",
        "editor.selectionBackground": "#d0e1fb",
        "editor.lineHighlightBackground": "#f3f3f3",
      },
    });

    monaco.editor.defineTheme("resume-chef-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "keyword.command", foreground: "5b8def", fontStyle: "bold" },
        { token: "keyword.environment", foreground: "ffb596", fontStyle: "bold" },
        { token: "keyword", foreground: "5b8def" },
        { token: "keyword.symbol", foreground: "9a9a9a" },
        { token: "keyword.math", foreground: "5b8def" },
        { token: "comment", foreground: "6b6b6b", fontStyle: "italic" },
        { token: "string", foreground: "ffb596" },
        { token: "attribute", foreground: "a3a3a3" },
        { token: "number", foreground: "b0b0b0" },
        { token: "number.math", foreground: "5b8def" },
        { token: "delimiter.math", foreground: "ffb596", fontStyle: "bold" },
        { token: "delimiter.bracket", foreground: "c0c0c0" },
      ],
      colors: {
        "editor.background": "#0e0e0f",
        "editor.foreground": "#f5f5f5",
        "editorLineNumber.foreground": "#6b6b6b",
        "editorLineNumber.activeForeground": "#a3a3a3",
        "editor.selectionBackground": "#37393b",
        "editor.lineHighlightBackground": "#0a0a0b",
      },
    });
  } catch (err) {
    configured = false;
    console.error("Failed to register LaTeX language for Monaco:", err);
  }
}

export function getEditorTheme(theme) {
  return theme === "dark" ? "resume-chef-dark" : "resume-chef-light";
}
