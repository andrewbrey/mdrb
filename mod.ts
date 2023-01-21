import { $, colors, Command, EnumType, readAll, tokens, ValidationError } from "./deps.ts";

/** Current module version */
export const version = "1.0.0";

/** Execute the specified markdown file */
export async function mdrb(args: string[]) {
  const modes = ["runbook", "isolated", "single"] as const;

  await new Command()
    .name("mdrb")
    .version(version)
    .description($.dedent`
      .${colors.bold("MD")} ${colors.bold("R")}un ${colors.bold("B")}ook

      Execute a markdown file with Deno
    `)
    .type("mode", new EnumType(modes))
    .option("-m, --mode <mode:mode>", "execution mode", { default: "runbook" })
    .option("-d, --dax <dax:boolean>", "inject dax", { default: true })
    .arguments("[file]")
    .action(async ({ mode, dax }, file = "") => {
      let mdContent;
      let mdFileUrl;

      const fileIsMD = [".md", ".markdown"].includes($.path.extname(file.toLowerCase()));
      const fileIsRemote = file.startsWith("http://") || file.startsWith("https://");
      const stdinIsTTY = Deno.isatty(Deno.stdin.rid);

      if (fileIsMD || fileIsRemote) {
        if (fileIsRemote) {
          mdContent = await $.request(file).timeout(30_000).noThrow().text();
          mdFileUrl = toFileURL("mdrb-remote.md");
        } else {
          invariant(await $.exists(file), `no file exists at ${file}`, ValidationError);

          mdContent = await Deno.readTextFile(await Deno.realPath(file));
          mdFileUrl = toFileURL(file);
        }
      } else {
        const ttyErrorMsg = "no .md file specified and unable to read one from stdin";
        invariant(!stdinIsTTY, ttyErrorMsg, ValidationError);

        mdContent = new TextDecoder().decode(await readAll(Deno.stdin));
        mdFileUrl = toFileURL("mdrb-stdin.md");
      }

      const noCodeMsg = fileIsMD || fileIsRemote ? `no code to run for ${file}` : "no code to run from stdin";

      invariant((mdContent ?? "").trim().length, noCodeMsg, ValidationError);

      const codeBlocks = mdCodeBlocks(mdContent, mdFileUrl);

      invariant(codeBlocks.length > 0, noCodeMsg, ValidationError);

      let daxImport = "";
      if (dax) {
        const thisFile = $.path.fromFileUrl(import.meta.url);
        const thisDir = $.path.dirname(thisFile);

        const daxDepsVersion = Deno.readTextFileSync($.path.join(thisDir, "deps.ts"))
          .match(/deno.land\/x\/dax@([^\/]+)/)?.at(1) ?? "";

        const daxImportVersion = daxDepsVersion ? `dax@${daxDepsVersion}` : "dax";

        daxImport = `import { $ } from "https://deno.land/x/${daxImportVersion}/mod.ts";`;
      }

      switch (mode as typeof modes[number]) {
        case "isolated": {
          for await (const [strIdx, block] of Object.entries(codeBlocks)) {
            const idx = parseInt(strIdx);
            const prettyIdx = idx + 1;
            const blockCount = codeBlocks.length;

            $.logStep("step:", prettyIdx, "of", blockCount);

            const encoded = `data:application/typescript,${encodeURIComponent([`${daxImport}\n`, block].join(""))}`;

            await $.raw`deno eval 'await import("${encoded}")'`;
          }
          break;
        }
        case "single": {
          const encoded = `data:application/typescript,${
            encodeURIComponent([`${daxImport}\n`, ...codeBlocks].join(""))
          }`;

          await $.raw`deno eval 'await import("${encoded}")'`;
          break;
        }
        default: {
          for await (const [strIdx, block] of Object.entries(codeBlocks)) {
            const idx = parseInt(strIdx);
            const prettyIdx = idx + 1;
            const blockCount = codeBlocks.length;

            $.logStep("step:", prettyIdx, "of", blockCount);

            const encoded = `data:application/typescript,${encodeURIComponent([`${daxImport}\n`, block].join(""))}`;

            await $.raw`deno eval 'await import("${encoded}")'`;

            if (idx < blockCount - 1) {
              const proceed = await $.confirm(`Proceed to step ${prettyIdx + 1}?`, {
                default: true,
              });

              if (!proceed) {
                const stepsLeft = blockCount - idx - 1;
                const msg = stepsLeft > 1 ? `remaining ${stepsLeft} steps` : "last step";

                $.logWarn("skipping", msg);

                break;
              }
            }
          }

          break;
        }
      }
    })
    .parse(args);
}

/** Enforce that a condition is true, and narrow types based on the assertion */
export function invariant(
  // deno-lint-ignore no-explicit-any
  condition: any,
  message = "invariant failed",
  // deno-lint-ignore no-explicit-any
  Err: new (...args: any[]) => Error = Error,
): asserts condition {
  if (condition) return;

  throw new Err(message);
}

/** Enforce that a path is an absolute file-protocol resolved relative to Deno.cwd if necessary */
export function toFileURL(path: string) {
  const noProtocol = path
    .replace(/^https:\/\//, "")
    .replace(/^http:\/\//, "")
    .replace(/^file:\/\//, "");

  const absolute = $.path.isAbsolute(noProtocol) ? noProtocol : $.path.join(Deno.cwd(), noProtocol);

  return $.path.toFileUrl(absolute).toString();
}

/** Extract valid code blocks from the specified markdown content */
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
      let token;
      let cursor = idx + 1;
      while ((token = mdTokens.at(cursor)) && token.type === "text") {
        codeContent.push(token.content);
        cursor++;
      }
    }
  });

  const codeBlocks = codeContent
    .map((code) => replaceImportMeta(code, mdFileUrl))
    .map((code) => fileProtocolifyLocalImports(code, mdFileUrl))
    .filter((code) => code.trim().length > 0);

  return codeBlocks;
}

/** Hard-code an `import.meta.url` value (replacement) for the source markdown module */
export function replaceImportMeta(code: string, mdFileUrl: string) {
  return code.replaceAll("import.meta.url", `\"${mdFileUrl}\"`);
}

/** Ensure that local imports are valid file-protocol URLS relative to the source markdown module */
export function fileProtocolifyLocalImports(code: string, mdFileUrl: string) {
  // - handles relative imports of: ts, js
  // - does not handle relative imports prefixed with a file:// protocol already
  const relativeImportRegex = /from\s+['"]([\.|\/][^'"]+\.(?:ts|js))['"]/g;

  return code.replaceAll(
    relativeImportRegex,
    (match, file) => match.replace(file, `${new URL(file, mdFileUrl)}`),
  );
}

if (import.meta.main) {
  await mdrb(Deno.args);
}
