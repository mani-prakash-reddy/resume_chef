import {
  codeBlockLookBack,
  findCompleteCodeBlock,
  findPartialCodeBlock,
  loadHighlighter,
  useCodeBlockToHtml,
  allLangs,
  allLangsAlias,
} from "@llm-ui/code";
import { markdownLookBack } from "@llm-ui/markdown";
import { useLLMOutput } from "@llm-ui/react";
import parseHtml from "html-react-parser";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getHighlighterCore } from "shiki/core";
import { bundledThemes } from "shiki/themes";
import { bundledLanguagesInfo } from "shiki/langs";
import getWasm from "shiki/wasm";

const MarkdownComponent = ({ blockMatch }) => {
  const markdown = blockMatch.output;
  return (
    <div className="markdown-body">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </div>
  );
};

const highlighter = loadHighlighter(
  getHighlighterCore({
    langs: allLangs(bundledLanguagesInfo),
    langAlias: allLangsAlias(bundledLanguagesInfo),
    themes: Object.values(bundledThemes),
    loadWasm: getWasm,
  })
);

const codeToHtmlOptions = {
  theme: "github-dark",
};

const CodeBlock = ({ blockMatch }) => {
  const { html, code } = useCodeBlockToHtml({
    markdownCodeBlock: blockMatch.output,
    highlighter,
    codeToHtmlOptions,
  });
  if (!html) {
    return (
      <pre className="shiki bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto my-2">
        <code>{code}</code>
      </pre>
    );
  }
  return <div className="my-2 rounded-md overflow-hidden">{parseHtml(html)}</div>;
};

export default function LlmMessage({ content, isStreamFinished }) {
  const { blockMatches } = useLLMOutput({
    llmOutput: content,
    fallbackBlock: {
      component: MarkdownComponent,
      lookBack: markdownLookBack(),
    },
    blocks: [
      {
        component: CodeBlock,
        findCompleteMatch: findCompleteCodeBlock(),
        findPartialMatch: findPartialCodeBlock(),
        lookBack: codeBlockLookBack(),
      },
    ],
    isStreamFinished,
  });

  return (
    <div>
      {blockMatches.map((blockMatch, index) => {
        const Component = blockMatch.block.component;
        return <Component key={index} blockMatch={blockMatch} />;
      })}
    </div>
  );
}
