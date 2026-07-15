// Cache-busted since we hand-patch this vendored file (see public/swiftlatex/PdfTeXEngine.js).
const ENGINE_SCRIPT = "/swiftlatex/PdfTeXEngine.js?v=3";
// Relayed same-origin to dodge the CDN's CORS restrictions (see vite.config.js
// / nginx.conf). The actual LaTeX compilation still runs 100% client-side;
// this only affects where on-demand TeX package/format files are fetched from.
const TEXLIVE_ENDPOINT = `${window.location.origin}/texlive-proxy/`;
// A cold first compile can be slow: the worker fetches the ~10MB pdftex
// format file plus every transitive package dependency (e.g. hyperref alone
// pulls in dozens of .sty files) one at a time over synchronous XHR inside
// the worker, so give it plenty of headroom before giving up.
const COMPILE_TIMEOUT_MS = 120000;
const MAIN_FILE = "main.tex";

let scriptPromise;
let enginePromise;
let engineInstance;
let compileQueue = Promise.resolve();
let lastObjectUrl;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

function ensureEngineScript() {
  if (!scriptPromise) {
    scriptPromise = loadScript(ENGINE_SCRIPT).then(() => {
      if (typeof window.PdfTeXEngine !== "function") {
        throw new Error("PdfTeXEngine failed to load");
      }
    });
  }
  return scriptPromise;
}

function destroyEngine() {
  // PdfTeXEngine.closeWorker() only *asks* the worker to close via postMessage,
  // which never gets processed while the worker is blocked inside a
  // synchronous XHR (e.g. fetching TeX packages). It then nulls out
  // engine.latexWorker immediately, so when that blocked call eventually
  // finishes and the engine tries to reset `latexWorker.onmessage`, it
  // throws "Cannot set properties of undefined". Terminate the raw worker
  // directly instead, which stops it immediately regardless of what it's
  // doing, and never gets a chance to run that cleanup code.
  try {
    engineInstance?.latexWorker?.terminate();
  } catch {
    // ignore
  }
  engineInstance = undefined;
  enginePromise = undefined;
}

async function getEngine() {
  await ensureEngineScript();
  if (!enginePromise) {
    enginePromise = (async () => {
      const engine = new window.PdfTeXEngine();
      await engine.loadEngine();
      engine.setTexliveEndpoint(TEXLIVE_ENDPOINT);
      engineInstance = engine;
      return engine;
    })().catch((err) => {
      enginePromise = undefined;
      throw err;
    });
  }
  return enginePromise;
}

/**
 * Compile LaTeX to a PDF object URL using the SwiftLaTeX WASM PdfTeX engine.
 * Compilation runs 100% client-side in a Web Worker; individual TeX package
 * files are fetched on demand from SwiftLaTeX's public texlive CDN.
 * @see https://github.com/SwiftLaTeX/SwiftLaTeX
 */
export async function compileLatexToPdfUrl(latexSource) {
  if (!latexSource?.trim()) {
    return null;
  }

  const runCompile = async () => {
    const engine = await getEngine();

    let timeoutId;
    const timeout = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        destroyEngine();
        reject(
          new Error(
            `LaTeX compilation timed out after ${COMPILE_TIMEOUT_MS / 1000}s. ` +
              "This can happen on a slow first compile (fetching TeX packages) " +
              "or if the document has an unresolvable issue. Try again.",
          ),
        );
      }, COMPILE_TIMEOUT_MS);
    });

    try {
      engine.writeMemFSFile(MAIN_FILE, latexSource);
      engine.setEngineMainFile(MAIN_FILE);
      const compilePromise = engine.compileLaTeX();
      // If the timeout wins the race below, this promise is abandoned but
      // keeps running in the background; attach a no-op catch so a late
      // settle doesn't surface as an unhandled promise rejection.
      compilePromise.catch(() => {});
      const result = await Promise.race([compilePromise, timeout]);

      if (result.status !== 0 || !result.pdf) {
        const detail = (result.log || "")
          .split("\n")
          .filter(Boolean)
          .slice(-20)
          .join("\n")
          .trim();
        throw new Error(
          detail
            ? `LaTeX compilation failed:\n${detail}`
            : "LaTeX compilation failed. Check your document for errors.",
        );
      }

      if (lastObjectUrl) {
        URL.revokeObjectURL(lastObjectUrl);
      }
      const blob = new Blob([result.pdf], { type: "application/pdf" });
      lastObjectUrl = URL.createObjectURL(blob);
      return lastObjectUrl;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const result = compileQueue.then(runCompile, runCompile);
  compileQueue = result.catch(() => {});
  return result;
}

export async function preloadLatexCompiler() {
  await getEngine();
}
