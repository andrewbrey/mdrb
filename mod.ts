import { $, colors, Command, EnumType, readAll, ValidationError } from "./deps.ts";
import { mdCodeBlocks } from "./src/markdown.ts";
import { invariant, toFileURL } from "./src/util.ts";

export const version = "1.2.4";
export const daxVersion = "0.24.1";

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
		.option("-m, --mode <mode:mode>", "execution mode", { default: "runbook" })
		.option("-d, --dax <dax:boolean>", "inject dax", { default: true })
		.arguments("[file]")
		.action(async ({ mode, dax }, file = "") => {
			let executionMode: Mode = mode as Mode;
			let mdContent;
			let mdFileUrl;

			const fileIsMD = [".md", ".markdown"].includes($.path.extname(file.toLowerCase()));
			const fileIsRemote = file.startsWith("http://") || file.startsWith("https://");
			const stdinIsTTY = Deno.isatty(Deno.stdin.rid);

			if (executionMode === "runbook" && !stdinIsTTY) executionMode = "isolated";

			if (fileIsMD || fileIsRemote) {
				if (fileIsRemote) {
					mdContent = await $.request(file).timeout(30_000).noThrow().text().catch(() => "");
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

			let maybeDaxImport = "";
			if (dax) {
				maybeDaxImport = `import { $ } from "https://deno.land/x/dax@${daxVersion}/mod.ts";\n`;
			}

			const nfmt = new Intl.NumberFormat();

			switch (executionMode) {
				case "isolated": {
					for await (const [strIdx, block] of Object.entries(codeBlocks)) {
						const idx = parseInt(strIdx);
						const prettyIdx = nfmt.format(idx + 1);
						const blockCount = nfmt.format(codeBlocks.length);

						let stepName = `step ${prettyIdx} of ${blockCount}`;
						if (block.summary) stepName += ` // ${block.summary}`;
						$.log(colors.dim(stepName));

						const encoded = asDataURI([maybeDaxImport, block.code]);

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
					for await (const [strIdx, block] of Object.entries(codeBlocks)) {
						const idx = parseInt(strIdx);
						const prettyIdx = nfmt.format(idx + 1);
						const prettyNextIdx = nfmt.format(idx + 2);
						const blockCount = codeBlocks.length;
						const prettyBlockCount = nfmt.format(blockCount);

						let stepName = `step ${prettyIdx} of ${prettyBlockCount}`;
						if (block.summary) stepName += ` // ${block.summary}`;
						$.log(colors.dim(stepName));

						const encoded = asDataURI([maybeDaxImport, block.code]);

						await $.raw`deno eval 'await import("${encoded}")'`;

						if (idx < blockCount - 1) {
							const proceed = await $.confirm(`\nProceed to step ${prettyNextIdx}?`, {
								default: true,
							});

							if (!proceed) {
								const stepsLeft = blockCount - idx - 1;
								const msg = stepsLeft > 1 ? `remaining ${colors.blue(`${stepsLeft}`)} steps` : "last step";

								$.log("");
								$.logWarn("skipped", msg);

								break;
							}
						}
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
