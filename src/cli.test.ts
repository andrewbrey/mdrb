import { assertEquals, assertRejects, assertStringIncludes } from "./deps.dev.ts";
import { $, CommandBuilder } from "./deps.ts";

const cli = $.relativePath(import.meta.url, "cli.ts");
const demo = $.relativePath(import.meta.url, "..", "demo.md");
const demoText = Deno.readTextFileSync(demo);

const t$ = $.build$({
	commandBuilder: new CommandBuilder().captureCombined(true)
		.noThrow(true).env({ NO_COLOR: "true" }).timeout(10_000),
});

const makeDetails = (opts?: { summary?: string; desc?: string }) => {
	const details = $.dedent`
		<details data-mdrb>
		${opts?.summary ? `<summary>${opts.summary}</summary>` : ""}

		<pre>
		description = "${opts?.desc ?? ""}"
		</pre>
		</details>
	`;

	return details;
};

// Adapted from https://github.com/dsherret/dax/blob/77c2e708d1c14e4afc657f0affa38a450ff35607/src/request.test.ts#L5
function withServer(action: (serverUrl: URL) => Promise<void>) {
	const controller = new AbortController();
	const signal = controller.signal;
	return new Promise<void>((resolve, reject) => {
		Deno.serve({
			hostname: "localhost",
			signal,
			async onListen(details) {
				const url = new URL(`http://localhost:${details.port}/`);
				try {
					await action(url);
					resolve();
					controller.abort();
				} catch (err) {
					reject(err);
					controller.abort();
				}
			},
		}, (request) => {
			const url = new URL(request.url);
			if (url.pathname === "/demo") {
				return new Response(demoText, { status: 200 });
			} else {
				return new Response("", { status: 404 });
			}
		});
	});
}

Deno.test("mdrb works with local file", async () => {
	const { combined } = await t$`deno run -A ${cli} ${demo}`.stdinText("");

	const expected = $.dedent`
		step 1 of 3 // say hello to the world

		Hello MDRB!

		step 2 of 3 // say hello to the world again
		
		Hello (again) MDRB!
		
		step 3 of 3 // log a final message to standard error
		
		heeeeey! this will be printed to stderr :)
	`;

	assertEquals(combined.trim(), expected.trim());
});

Deno.test("mdrb shows error output for local file if no file exists", async () => {
	const { combined, code } = await t$`deno run -A ${cli} ./does-not-exist.md`.stdinText("");

	assertEquals(code, 2);
	assertStringIncludes(combined, "no file exists at ./does-not-exist.md");
});

Deno.test("mdrb shows error output for local file if text read", async () => {
	const file = await Deno.makeTempFile({ prefix: "mdrb-test_", suffix: ".md" });

	const { combined, code } = await t$`deno run -A ${cli} ${file}`.stdinText("");

	assertEquals(code, 2);
	assertStringIncludes(combined, `no code to run for ${file}`);
});

Deno.test("mdrb works with http", async () => {
	await withServer(async (serverURL) => {
		const url = new URL("/demo", serverURL);

		const { combined } = await t$`deno run -A ${cli} ${url}`.stdinText("");

		const expected = $.dedent`
			step 1 of 3 // say hello to the world
			
			Hello MDRB!
			
			step 2 of 3 // say hello to the world again
			
			Hello (again) MDRB!
			
			step 3 of 3 // log a final message to standard error
			
			heeeeey! this will be printed to stderr :)
		`;

		assertEquals(combined.trim(), expected.trim());
	});
});

Deno.test("mdrb shows error output for http if no text served", async () => {
	await withServer(async (serverURL) => {
		const url = new URL("/does-not-exist", serverURL);

		const { combined, code } = await t$`deno run -A ${cli} ${url}`.stdinText("");

		assertEquals(code, 2);
		assertStringIncludes(combined, "no code to run for http://localhost");
	});
});

Deno.test("mdrb works with stdin", async () => {
	const { combined } = await t$`deno run -A ${cli}`.stdinText(demoText);

	const expected = $.dedent`
		step 1 of 3 // say hello to the world
		
		Hello MDRB!
		
		step 2 of 3 // say hello to the world again
		
		Hello (again) MDRB!
		
		step 3 of 3 // log a final message to standard error
		
		heeeeey! this will be printed to stderr :)
	`;

	assertEquals(combined.trim(), expected.trim());
});

Deno.test("mdrb shows error output for stdin if no text piped", async () => {
	const { combined, code } = await t$`deno run -A ${cli}`.stdinText("");

	assertEquals(code, 2);
	assertStringIncludes(combined, "no code to run from stdin");
});

Deno.test(
	"mdrb switches to 'isolated' mode from 'runbook' mode for stdin and does not wait for step confirmation",
	async () => {
		const timeout = 3_000;

		await t$`deno run -A ${cli} --mode runbook`.stdinText(demoText)
			.timeout(timeout).noThrow(false);
	},
);

Deno.test("$ is defined by default", async () => {
	const md = $.dedent`
		~~~ts
		console.log("$ is", typeof $);
		~~~
	`;

	const { combined } = await t$`deno run -A ${cli}`
		.stdinText(md);

	assertStringIncludes(combined, "$ is function");
});

Deno.test("$ is undefined if dax integration disabled", async () => {
	const md = $.dedent`
		~~~ts
		console.log("$ is", typeof $);
		~~~
	`;

	const { combined } = await t$`deno run -A ${cli} --dax=false`
		.stdinText(md);

	assertStringIncludes(combined, "$ is undefined");
});

Deno.test("single mode throws if blocks are incompatible", async () => {
	await assertRejects(async () => {
		const md = $.dedent`
		~~~ts
		const a = 1;
		~~~

		~~~ts
		const a = 2;
		console.log("a is", a);
		~~~
	`;

		await t$`deno run -A ${cli} --mode=single`.stdinText(md).noThrow(false);
	});
});

Deno.test("summary is printed if one is available", async () => {
	const summary = "this is the step name";

	const md = $.dedent`
		${makeDetails({ summary })}
		
		~~~ts
		console.log("$ is", typeof $);
		~~~
	`;

	const { combined } = await t$`deno run -A ${cli}`
		.stdinText(md);

	assertStringIncludes(combined, `step 1 of 1 // ${summary}`);
});

Deno.test("summary is not printed if one is not available", async () => {
	const summary = "";

	const md = $.dedent`
		${makeDetails({ summary })}
		
		~~~ts
		console.log("$ is", typeof $);
		~~~
	`;

	const { stderr } = await t$`deno run -A ${cli}`
		.captureCombined(false).stdinText(md);

	assertEquals(stderr.trim(), "step 1 of 1");
});
