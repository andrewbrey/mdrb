import { tokens } from "../deps.ts";

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
  const mdTokens = tokens(mdContent);
  const supportedLanguages = ["js", "javascript", "ts", "typescript"];
  const codeContent: string[] = [];

  mdTokens.forEach((token, idx) => {
    if (
      token.type === "start" &&
      token.tag === "codeBlock" &&
      token.kind === "fenced" &&
      supportedLanguages.includes(token.language)
    ) {
      // IDEA: inside a code block, could parse metadata
      //       about this block from comments to expose
      //       things like titles, descriptions, conditions
      //       (like "if on windows"), etc.
      let token;
      let cursor = idx + 1;
      while ((token = mdTokens.at(cursor)) && token.type === "text") {
        codeContent.push(token.content);
        cursor++;
      }
    }
  });

  // TODO: remove debug logs
  console.log("codeContent", codeContent);

  const codeBlocks = codeContent
    .map((code) => replaceImportMeta(code, mdFileUrl))
    .map((code) => fileProtocolifyLocalImports(code, mdFileUrl))
    .filter((code) => code.trim().length > 0);

  // TODO: remove debug logs
  console.log("codeBlocks", codeBlocks);

  return codeBlocks;
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
    (match, file) => match.replace(file, `${new URL(file, mdFileUrl)}`),
  );
}
