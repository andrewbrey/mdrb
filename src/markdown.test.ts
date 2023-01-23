import { assertEquals, assertThrows } from "../deps.dev.ts";
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
      blocks.at(0),
      $.dedent`
        import mod from "file://a/b/mod.ts";
        console.log("hello world");\n
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
      blocks.at(0),
      $.dedent`
        import mod from "file:///D:/a/b/mod.ts";
        console.log("hello world");\n
      `,
    );
  }
});

Deno.test("mdCodeBlocks works for multiple blocks", () => {
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
      assertEquals(
        blocks.at(idx - 1),
        $.dedent`
          import mod from "file://a/b/mod.ts";
          console.log("hello world${idx}");\n
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

Deno.test("mdCodeBlocks works for tilde blocks", () => {
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
    assertEquals(
      blocks.at(0),
      $.dedent`
        import mod from "file://a/b/mod.ts";
        console.log("hello world");\n
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

Deno.test("mdCodeBlocks throws on single-quotes", () => {
  assertThrows(() => {
    const url = "file://a/b/c.ts";

    const code = $.dedent`
      ~~~ts
      console.log('hello world');
      ~~~
    `;

    mdCodeBlocks(code, url);
  });
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
