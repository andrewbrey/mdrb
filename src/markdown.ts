import { $ } from "../deps.ts";

type CodeBlock = {
  code: string;
  summary: string;
  config: Record<string, unknown>;
};

/**
 * Extract valid code blocks from the specified markdown content
 *
 * NOTE: this function is adapted from a related feature in
 * [c4spar/deno-dzx](https://github.com/c4spar/deno-dzx/blob/c70a9868fe51d39313e8e1bca0b01ef660cba2b6/src/cli/lib/markdown.ts)
 * and note also that I, @andrewbrey, am the original author
 * of the markdown execution code in `deno-dzx`. Thanks @c4spar
 * for your excellent libraries and for keeping `deno-dzx`
 * permissively licenced so I can re-use my code in my own project!
 */
export function mdCodeBlocks(mdContent: string, mdFileUrl: string) {
  const blocks: CodeBlock[] = [];
  const supportedLanguages = ["js", "javascript", "ts", "typescript"];
  const mdTokens = $.parseMarkdown(mdContent);

  mdTokens.forEach((mdToken, idx) => {
    if (
      mdToken.type === "start" &&
      mdToken.tag === "codeBlock" &&
      mdToken.kind === "fenced" &&
      supportedLanguages.includes(mdToken.language)
    ) {
      const block: CodeBlock = {
        code: "",
        summary: "",
        config: {},
      };

      let codeCursor = idx + 1;
      let codeCursorToken = mdTokens.at(codeCursor);
      while (codeCursorToken && codeCursorToken.type === "text") {
        block.code += codeCursorToken.content;
        codeCursor++;
        codeCursorToken = mdTokens.at(codeCursor);
      }

      if (!block.code.trim().length) return;

      let configCursor = idx - 1;
      let configCursorToken = mdTokens.at(configCursor);
      let blockConfig = "";
      while (configCursorToken && configCursor >= 0 && configCursorToken.type === "html") {
        blockConfig = `${configCursorToken.content}${blockConfig}`;
        configCursor--;
        configCursorToken = mdTokens.at(configCursor);
      }

      // ode to the ol' jquery naming conventions :)
      const $blockConfig = $.parseHTML(blockConfig);
      const $details = $blockConfig("details[data-mdrb]");
      const $summary = $blockConfig("summary", $details);
      const $pre = $blockConfig("pre", $details);
      const details = $.dedent`
        ${$pre.text() ?? ""}
      `;

      block.summary = ($summary.text() ?? "").trim();
      block.config = details ? $.parseTOML(details) : {};

      blocks.push(block);
    }
  });

  for (const b of blocks) {
    b.code = replaceImportMeta(b.code, mdFileUrl);
    b.code = fileProtocolifyLocalImports(b.code, mdFileUrl);
  }

  return blocks;
}

/** Hard-code an `import.meta.url` value (replacement) for the source markdown module */
export function replaceImportMeta(code: string, mdFileUrl: string) {
  return code.replaceAll("import.meta.url", `\"${mdFileUrl}\"`);
}

/** Ensure that local imports are valid file-protocol URLS relative to the source markdown module */
export function fileProtocolifyLocalImports(code: string, mdFileUrl: string) {
  // - handles relative imports of: ts, tsx, mts, js, mjs, jsx, cjs, cts
  // - does not handle relative imports prefixed with a file:// protocol already
  const relativeImportRegex = /from\s+['"]([\.|\/][^'"]+\.(?:ts|tsx|mts|js|mjs|jsx|cjs|cts))['"]/g;

  return code.replaceAll(
    relativeImportRegex,
    (match, file) => match.replace(file, `${new URL(file, mdFileUrl)}`).replaceAll("'", '"'),
  );
}
