import { $, colors, type Extension, renderMarkdown } from "../deps.ts";

export type CodeBlock = {
	idx: number;
	code: string;
	summary: string;
	config: Record<string, unknown> & { description?: string };
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

	let blockIdx = 0;
	mdTokens.children?.forEach((mdToken, idx) => {
		if (
			mdToken.type === "code" &&
			supportedLanguages.includes(mdToken.lang)
		) {
			const block: CodeBlock = {
				idx: blockIdx,
				code: mdToken.value.trim(),
				summary: "",
				config: {},
			};
			blockIdx++;

			if (!block.code.length) return;

			let configCursor = idx - 1;
			let configCursorToken = mdTokens.children?.at(configCursor);
			let blockConfig = "";
			while (configCursorToken && configCursor >= 0 && configCursorToken.type === "html") {
				blockConfig = `${configCursorToken.value}${blockConfig}`;
				configCursor--;
				configCursorToken = mdTokens.children?.at(configCursor);
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

export function renderMDToString(mdContent: string, opts: { linePrefix?: string; lineTruncate?: boolean } = {}) {
	if (!mdContent?.trim()) return "";

	const linePrefix = opts.linePrefix ?? `  ${colors.white.bgWhite.dim(" ")}  `;
	const lineTruncate = opts.lineTruncate ?? true;

	const HighlightTS: Extension = {
		generateNode(_generatorFn, node, _parent, _options) {
			if (node.type === "code") {
				let code: string = node.value || "// <empty code block>";
				const lang = node.lang ?? "codeblock";

				// Replace leading tabs with two spaces to conserve width
				code = code.split(/\r?\n/g).map((l) => {
					let foundNonTab = false;
					let noLeadingTabs = "";
					l.split("").map((c) => {
						if (!foundNonTab && c === "\t") {
							noLeadingTabs += "  ";
						} else {
							noLeadingTabs += c;
							foundNonTab = true;
						}

						return noLeadingTabs;
					});

					return noLeadingTabs;
				}).join("\n");

				const columns = Deno.stdin.isTerminal() ? Deno.consoleSize().columns : 80;
				const linePrefixWidth = $.stripAnsi(linePrefix).length;
				const maxRenderWidth = columns - linePrefixWidth;

				switch (lang) {
					case "ts":
					case "typescript":
					case "js":
					case "javascript":
					case "json":
					case "jsonc":
					case "json5":
						// TODO: restore code highlighting for typescript here
						// code = new Typescript(code, DefaultTheme, { output: "console" }).highlight();
						break;
				}

				code = code.split(/\r?\n/g)
					.map((l) => {
						const assumedTabSize = 8;
						const lineNoAnsi = $.stripAnsi(l);
						const lineTextLength = lineNoAnsi.trimEnd().length;
						const tabsLength = lineNoAnsi.split("").filter((c) => c === "\t").length * assumedTabSize;
						const lineRenderLength = lineTextLength + tabsLength;
						if (lineRenderLength < maxRenderWidth) return l;

						return lineTruncate ? `${l.slice(0, Math.max(0, maxRenderWidth - tabsLength))}${colors.reset("...")}` : l;
					})
					.join("\n");

				const borderChar = " ";
				const borderColor = colors.brightBlue.bgBlue;
				return $.dedent`
					${borderColor.italic(` ${lang} `)}${borderColor.dim("".padEnd(maxRenderWidth - lang.length - 2, borderChar))}
					${code}
					${borderColor.dim("".padEnd(maxRenderWidth, borderChar))}
					
				`;
			}
		},
	};

	return renderMarkdown(mdContent.trim(), { extensions: [HighlightTS] })
		.trim().split(/\r?\n/g).map((l) => l.trimEnd())
		.map((l) => `${linePrefix}${l}`).join("\n");
}
