import { $, colors, Command, EnumType, readAll, ValidationError } from "./deps.ts";
import { type CodeBlock, mdCodeBlocks, renderMDToString } from "./markdown.ts";
import { invariant, toFileURL } from "./util.ts";

/** Current version of MDRB */
export const version = "3.0.4";

/** Bundled version of `@david/dax` */
export const daxVersion = "0.42.0";

if (import.meta.main) {
	const modes = ["runbook", "isolated", "single"] as const;
	type Mode = typeof modes[number];

	await new Command()
		.name("mdrb")
		.version(version)
		.description($.dedent`
			.${colors.bold("MD")} ${colors.bold("R")}un ${colors.bold("B")}ook

			Execute a markdown file with Deno
		`)
		.type("mode", new EnumType(modes))
		.option("--mode <mode:mode>", "execution mode", { default: "runbook" })
		.option("--dax <dax:boolean>", "inject the dax $ object", { default: true })
		.option("--isolated-desc <isolatedDesc:boolean>", "show block descriptions (if available) in 'isolated' mode", {
			default: false,
		})
		.arguments("[file]")
		.action(async ({ mode, dax, isolatedDesc }, file = "") => {
			let executionMode: Mode = mode as Mode;
			let mdContent;
			let mdFileUrl;

			const fileIsMD = [".md", ".markdown"].includes($.path(file.toLowerCase()).extname() ?? "N/A");
			const fileIsRemote = file.startsWith("http://") || file.startsWith("https://");
			const stdinIsTTY = Deno.stdin.isTerminal();

			if (executionMode === "runbook" && !stdinIsTTY) executionMode = "isolated";

			if (fileIsMD || fileIsRemote) {
				if (fileIsRemote) {
					mdContent = await $.request(file).timeout(30_000).noThrow().text().catch(() => "");
					mdFileUrl = toFileURL("mdrb-remote.md");
				} else {
					invariant(await $.path(file).exists(), `no file exists at ${file}`, ValidationError);

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

			let maybeDaxImport = "";
			if (dax) {
				maybeDaxImport = `import { $ } from "jsr:@david/dax@${daxVersion}";\n`;
			}

			switch (executionMode) {
				case "isolated": {
					for await (const block of codeBlocks) {
						const ctx = blockContext(block, codeBlocks);

						if (!ctx.isFirst) $.log("");
						$.log(colors.dim(ctx.stepName));
						if (isolatedDesc) {
							if (ctx.description) $.log(ctx.description);
						} else {
							$.log("");
						}

						const encoded = asDataURI([maybeDaxImport, block.code]);

						if (isolatedDesc) $.log("");
						await $.raw`deno eval 'await import("${encoded}")'`;
					}
					break;
				}
				case "single": {
					const encoded = asDataURI([maybeDaxImport, ...codeBlocks.map((b) => b.code)]);

					await $.raw`deno eval 'await import("${encoded}")'`;
					break;
				}
				default: {
					for await (const block of codeBlocks) {
						const ctx = blockContext(block, codeBlocks);

						if (!ctx.isFirst) $.log("");
						$.log(colors.dim(ctx.stepName));
						if (ctx.description) $.log(ctx.description);

						const proceed = await $.confirm(`${colors.reset("\n")}execute step ${colors.green(ctx.prettyIdx)}`, {
							default: true,
						});

						if (!proceed) {
							const msg = ctx.remaining > 0
								? `${colors.yellow(`${ctx.prettyRemaining}`)} steps`
								: `${colors.yellow("1")} step`;

							$.log("");
							$.log("skipped", msg);

							break;
						}

						const encoded = asDataURI([maybeDaxImport, block.code]);

						$.log("");
						await $.raw`deno eval 'await import("${encoded}")'`;
					}

					break;
				}
			}
		})
		.parse(Deno.args);
}

/**
 * Encode the specified code blocks as a TypeScript
 * data URI, handling the fact that certain characters
 * (like single-quotes) are not encoded by
 * `encodeURIComponent` by simply manually replacing
 * them after encoding.
 */
function asDataURI(blocks: string[]) {
	return `data:application/typescript,${
		encodeURIComponent(blocks.join(""))
			.replaceAll("'", "%27")
	}`;
}

function blockContext(current: CodeBlock, all: CodeBlock[]) {
	const { idx, summary, config } = current;

	const nfmt = new Intl.NumberFormat();
	const prettyIdx = nfmt.format(idx + 1);
	const desc = config.description?.trim() ?? "";

	const blockCount = all.length;
	const prettyBlockCount = nfmt.format(blockCount);

	const nextIdx = idx + 1;
	const prettyNextIdx = nfmt.format(nextIdx + 1);
	const next = all.at(nextIdx);
	const nextDesc = next?.config?.description?.trim() ?? "";
	const nextSummary = next?.summary.trim() ?? "";

	const isFirst = idx === 0;
	const isLast = idx >= blockCount - 1;
	const remaining = blockCount - idx - 1;
	const prettyRemaining = nfmt.format(remaining + 1);

	let stepName = `step ${prettyIdx} of ${prettyBlockCount}`;
	if (summary) stepName += ` // ${summary}`;

	return {
		idx,
		prettyIdx,
		stepName,
		summary,
		config,
		description: renderMDToString(desc),
		blockCount,
		prettyBlockCount,
		nextIdx,
		prettyNextIdx,
		nextSummary,
		nextDescription: renderMDToString(nextDesc),
		isFirst,
		isLast,
		remaining,
		prettyRemaining,
	};
}
