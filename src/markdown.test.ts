import { assertEquals } from "../deps.dev.ts";
import { $ } from "../deps.ts";
import { fileProtocolifyLocalImports, mdCodeBlocks, replaceImportMeta } from "./markdown.ts";

const FENCE = "```";

Deno.test("mdCodeBlocks works for posix", () => {
	const url = "file://a/b/c.ts";

	for (const ext of "ts|typescript|js|javascript".split("|")) {
		const code = $.dedent`
			${FENCE}${ext}
			import mod from "./mod.ts";
			console.log("hello world");
			${FENCE}
		`;

		const blocks = mdCodeBlocks(code, url);

		assertEquals(blocks.length, 1);
		assertEquals(
			blocks.at(0)?.code,
			$.dedent`
				import mod from "file://a/b/mod.ts";
				console.log("hello world");
			`,
		);
	}
});

Deno.test("mdCodeBlocks works for windows", () => {
	const url = "file:///D:\\a\\b\\c.ts";

	for (const ext of "ts|typescript|js|javascript".split("|")) {
		const code = $.dedent`
			${FENCE}${ext}
			import mod from "./mod.ts";
			console.log("hello world");
			${FENCE}
		`;

		const blocks = mdCodeBlocks(code, url);

		assertEquals(blocks.length, 1);
		assertEquals(
			blocks.at(0)?.code,
			$.dedent`
				import mod from "file:///D:/a/b/mod.ts";
				console.log("hello world");
			`,
		);
	}
});

Deno.test("mdCodeBlocks works for multiple blocks and block idx is accurate", () => {
	const url = "file://a/b/c.ts";

	for (const ext of "ts|typescript|js|javascript".split("|")) {
		const code = $.dedent`
			${FENCE}${ext}
			import mod from "./mod.ts";
			console.log("hello world1");
			${FENCE}

			${FENCE}${ext}
			import mod from "./mod.ts";
			console.log("hello world2");
			${FENCE}

			${FENCE}${ext}
			import mod from "./mod.ts";
			console.log("hello world3");
			${FENCE}
		`;

		const blocks = mdCodeBlocks(code, url);

		assertEquals(blocks.length, 3);
		for (const idx of [1, 2, 3]) {
			const blockIdx = idx - 1;
			const block = blocks.at(blockIdx);

			assertEquals(block?.idx, blockIdx);
			assertEquals(
				block?.code,
				$.dedent`
					import mod from "file://a/b/mod.ts";
					console.log("hello world${idx}");
				`,
			);
		}
	}
});

Deno.test("mdCodeBlocks ignores blocks for other languages", () => {
	const url = "file://a/b/c.ts";

	for (const ext of "some|other|languages".split("|")) {
		const code = $.dedent`
			${FENCE}${ext}
			// ignored
			${FENCE}
 
			${FENCE}
			// ignored
			${FENCE}
		`;

		const blocks = mdCodeBlocks(code, url);

		assertEquals(blocks.length, 0);
	}
});

Deno.test("mdCodeBlocks works for tilde blocks and block idx works", () => {
	const url = "file://a/b/c.ts";

	for (const ext of "ts|typescript|js|javascript".split("|")) {
		const code = $.dedent`
			~~~${ext}
			import mod from "./mod.ts";
			console.log("hello world");
			~~~
		`;

		const blocks = mdCodeBlocks(code, url);

		assertEquals(blocks.length, 1);
		assertEquals(blocks.at(0)?.idx, 0);
		assertEquals(
			blocks.at(0)?.code,
			$.dedent`
				import mod from "file://a/b/mod.ts";
				console.log("hello world");
			`,
		);
	}
});

Deno.test("mdCodeBlocks ignores inline code", () => {
	const url = "file://a/b/c.ts";

	const code = $.dedent`
		> this has some \`inline code\`
	`;

	const blocks = mdCodeBlocks(code, url);

	assertEquals(blocks.length, 0);
});

Deno.test("mdCodeBlocks does not throw on single-quotes", () => {
	const url = "file://a/b/c.ts";

	const code = $.dedent`
		~~~ts
		// this comment has 'single quotes'
		import mod from '${url}'; // import with single-quotes

		console.log('hello world');
		console.log("this shouldn't throw");
		console.log(\`this shouldn't either\`)
		~~~
	`;

	mdCodeBlocks(code, url);
});

Deno.test("mdCodeBlocks parses configuration", () => {
	const url = "file://a/b/c.ts";
	const summary = "a very good step summary";

	const code = $.dedent`
		<details data-mdrb>
		<summary>${summary}</summary>
		
		<pre>
		key1 = "value1"

		[second]
		name = "value2"
		</pre>
		</details>

		~~~ts
		console.log(import.meta.url)
		~~~
	`;

	const blocks = mdCodeBlocks(code, url);

	assertEquals(blocks.length, 1);
	assertEquals(blocks.at(0)?.summary, summary);
	assertEquals(blocks.at(0)?.config, { key1: "value1", second: { name: "value2" } });
});

Deno.test("mdCodeBlocks requires the data-mdrb attribute on configuration", () => {
	const url = "file://a/b/c.ts";
	const summary = "a very good step summary";

	const code = $.dedent`
		<details>
		<summary>${summary}</summary>

		<pre>
		key1 = "value1"

		[second]
		name = "value2"
		</pre>
		</details>

		~~~ts
		console.log(import.meta.url)
		~~~
	`;

	const blocks = mdCodeBlocks(code, url);

	assertEquals(blocks.length, 1);
	assertEquals(blocks.at(0)?.summary, "");
	assertEquals(blocks.at(0)?.config, {});
});

Deno.test("mdCodeBlocks configuration must immdiately preceed code blocks", () => {
	const url = "file://a/b/c.ts";
	const summary = "a very good step summary";

	const code = $.dedent`
		<details>
		<summary>${summary}</summary>

		<pre>
		key1 = "value1"

		[second]
		name = "value2"
		</pre>
		</details>

		# a header between the code and configuration

		~~~ts
		console.log(import.meta.url)
		~~~
	`;

	const blocks = mdCodeBlocks(code, url);

	assertEquals(blocks.length, 1);
	assertEquals(blocks.at(0)?.summary, "");
	assertEquals(blocks.at(0)?.config, {});
});

Deno.test("mdCodeBlocks configuration does not require a summary", () => {
	const url = "file://a/b/c.ts";

	const code = $.dedent`
		<details data-mdrb>

		<pre>
		key1 = "value1"

		[second]
		name = "value2"
		</pre>
		</details>

		~~~ts
		console.log(import.meta.url)
		~~~
	`;

	const blocks = mdCodeBlocks(code, url);

	assertEquals(blocks.length, 1);
	assertEquals(blocks.at(0)?.summary, "");
	assertEquals(blocks.at(0)?.config, { key1: "value1", second: { name: "value2" } });
});

Deno.test("mdCodeBlocks configuration can have only a summary", () => {
	const url = "file://a/b/c.ts";
	const summary = "a very good step summary";

	const code = $.dedent`
		<details data-mdrb>
		<summary>${summary}</summary>
		</details>

		~~~ts
		console.log(import.meta.url)
		~~~
	`;

	const blocks = mdCodeBlocks(code, url);

	assertEquals(blocks.length, 1);
	assertEquals(blocks.at(0)?.summary, summary);
	assertEquals(blocks.at(0)?.config, {});
});

Deno.test("mdCodeBlocks configuration can contain no details", () => {
	const url = "file://a/b/c.ts";

	const code = $.dedent`
		<details data-mdrb>
		
		</details>

		~~~ts
		console.log(import.meta.url)
		~~~
	`;

	const blocks = mdCodeBlocks(code, url);

	assertEquals(blocks.length, 1);
	assertEquals(blocks.at(0)?.summary, "");
	assertEquals(blocks.at(0)?.config, {});
});

Deno.test("mdCodeBlocks configuration pre must have a preceeding newline to behave as expected", () => {
	const url = "file://a/b/c.ts";

	const code = $.dedent`
		<details data-mdrb>
		<summary>test1</summary>
		<pre>
		key1 = "value1"

		[second]
		name = "value2"
		</pre>
		</details>

		~~~ts
		console.log(import.meta.url)
		~~~

		<details data-mdrb>
		<summary>test2</summary>

		<pre>
		key1 = "value3"

		[second]
		name = "value4"
		</pre>
		</details>

		~~~ts
		console.log(import.meta.url)
		~~~
	`;

	const blocks = mdCodeBlocks(code, url);

	assertEquals(blocks.length, 2);
	assertEquals(blocks.at(0)?.summary, "");
	assertEquals(blocks.at(0)?.config, {});
	assertEquals(blocks.at(1)?.summary, "test2");
	assertEquals(blocks.at(1)?.config, { key1: "value3", second: { name: "value4" } });
});

Deno.test("mdCodeBlocks different blocks can have different configuration", () => {
	const url = "file://a/b/c.ts";
	const summary = "a very good step summary";

	const code = $.dedent`
		# This is a title
		
		<details data-mdrb>
		<summary>${summary}</summary>

		<pre>
		key = "value1"
		</pre>
		</details>

		~~~ts
		console.log(import.meta.url)
		~~~

		## This is a second level title

		<details data-mdrb>
		<summary>${summary + " 2"}</summary>

		<pre>
		key = "value2"
		</pre>
		</details>

		~~~ts
		console.log(import.meta.url)
		~~~
	`;

	const blocks = mdCodeBlocks(code, url);

	assertEquals(blocks.length, 2);
	assertEquals(blocks.at(0)?.summary, summary);
	assertEquals(blocks.at(0)?.config, { key: "value1" });
	assertEquals(blocks.at(1)?.summary, summary + " 2");
	assertEquals(blocks.at(1)?.config, { key: "value2" });
});

Deno.test("replaceImportMeta works for posix", () => {
	const url = "file://a/b/c.ts";

	assertEquals(replaceImportMeta("import.meta.url", url), `"${url}"`);
	assertEquals(replaceImportMeta("'import.meta.url'", url), `'"${url}"'`);
	assertEquals(replaceImportMeta('"import.meta.url"', url), `""${url}""`);
	assertEquals(replaceImportMeta("import.meta.main", url), `import.meta.main`);
});

Deno.test("replaceImportMeta works for windows", () => {
	const url = "file:///D:\\a\\b\\c.ts";

	assertEquals(replaceImportMeta("import.meta.url", url), `"${url}"`);
	assertEquals(replaceImportMeta("'import.meta.url'", url), `'"${url}"'`);
	assertEquals(replaceImportMeta('"import.meta.url"', url), `""${url}""`);
	assertEquals(replaceImportMeta("import.meta.main", url), `import.meta.main`);
});

Deno.test("fileProtocolifyLocalImports works for posix", () => {
	const url = "file://a/b/c.ts";

	for (const ext of "ts|tsx|mts|js|mjs|jsx|cjs|cts".split("|")) {
		assertEquals(
			fileProtocolifyLocalImports(`import a from './mod.${ext}';`, url),
			`import a from "file://a/b/mod.${ext}";`,
		);

		assertEquals(
			fileProtocolifyLocalImports(`import a from '/root/mod.${ext}';`, url),
			`import a from "file://a/root/mod.${ext}";`,
		);

		assertEquals(
			fileProtocolifyLocalImports(`import {abc} from './mod.${ext}';`, url),
			`import {abc} from "file://a/b/mod.${ext}";`,
		);

		assertEquals(
			fileProtocolifyLocalImports(`import {default as abc} from './mod.${ext}';`, url),
			`import {default as abc} from "file://a/b/mod.${ext}";`,
		);

		assertEquals(
			fileProtocolifyLocalImports(`import abc, {def, type ghi} from './mod.${ext}';`, url),
			`import abc, {def, type ghi} from "file://a/b/mod.${ext}";`,
		);

		assertEquals(
			fileProtocolifyLocalImports(`import abc from './mod.wasm';`, url),
			`import abc from './mod.wasm';`,
		);

		assertEquals(
			fileProtocolifyLocalImports(
				$.dedent`
					import * as mod from './mod.${ext}';
					import * as another from '../another.${ext}';
				`,
				url,
			),
			$.dedent`
				import * as mod from "file://a/b/mod.${ext}";
				import * as another from "file://a/another.${ext}";
			`,
		);
	}
});

Deno.test("fileProtocolifyLocalImports works for windows", () => {
	const url = "file:///D:\\a\\b\\c.ts";

	for (const ext of "ts|tsx|mts|js|mjs|jsx|cjs|cts".split("|")) {
		assertEquals(
			fileProtocolifyLocalImports(`import abc from './mod.${ext}';`, url),
			`import abc from "file:///D:/a/b/mod.${ext}";`,
		);

		assertEquals(
			fileProtocolifyLocalImports(`import abc from '/root/mod.${ext}';`, url),
			`import abc from "file:///D:/root/mod.${ext}";`,
		);

		assertEquals(
			fileProtocolifyLocalImports(`import {abc} from './mod.${ext}';`, url),
			`import {abc} from "file:///D:/a/b/mod.${ext}";`,
		);

		assertEquals(
			fileProtocolifyLocalImports(`import {default as abc} from './mod.${ext}';`, url),
			`import {default as abc} from "file:///D:/a/b/mod.${ext}";`,
		);

		assertEquals(
			fileProtocolifyLocalImports(`import abc, {def, type ghi} from './mod.${ext}';`, url),
			`import abc, {def, type ghi} from "file:///D:/a/b/mod.${ext}";`,
		);

		assertEquals(
			fileProtocolifyLocalImports(`import abc from './mod.wasm';`, url),
			`import abc from './mod.wasm';`,
		);

		assertEquals(
			fileProtocolifyLocalImports(
				$.dedent`
					import * as mod from './mod.${ext}';
					import * as another from '../another.${ext}';
				`,
				url,
			),
			$.dedent`
				import * as mod from "file:///D:/a/b/mod.${ext}";
				import * as another from "file:///D:/a/another.${ext}";
			`,
		);
	}
});
