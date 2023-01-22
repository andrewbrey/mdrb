import { assertEquals } from "../deps.test.ts";
import { $ } from "../deps.ts";
import { fileProtocolifyLocalImports, replaceImportMeta } from "./markdown.ts";

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
      `import a from 'file://a/b/mod.${ext}';`,
    );

    assertEquals(
      fileProtocolifyLocalImports(`import {abc} from './mod.${ext}';`, url),
      `import {abc} from 'file://a/b/mod.${ext}';`,
    );

    assertEquals(
      fileProtocolifyLocalImports(`import {default as abc} from './mod.${ext}';`, url),
      `import {default as abc} from 'file://a/b/mod.${ext}';`,
    );

    assertEquals(
      fileProtocolifyLocalImports(`import abc, {def, type ghi} from './mod.${ext}';`, url),
      `import abc, {def, type ghi} from 'file://a/b/mod.${ext}';`,
    );
  }
});

Deno.test("fileProtocolifyLocalImports works for windows", () => {
  const url = "file:///D:\\a\\b\\c.ts";

  for (const ext of "ts|tsx|mts|js|mjs|jsx|cjs|cts".split("|")) {
    assertEquals(
      fileProtocolifyLocalImports(`import abc from './mod.${ext}';`, url),
      `import abc from 'file:///D:/a/b/mod.${ext}';`,
    );

    assertEquals(
      fileProtocolifyLocalImports(`import {abc} from './mod.${ext}';`, url),
      `import {abc} from 'file:///D:/a/b/mod.${ext}';`,
    );

    assertEquals(
      fileProtocolifyLocalImports(`import {default as abc} from './mod.${ext}';`, url),
      `import {default as abc} from 'file:///D:/a/b/mod.${ext}';`,
    );

    assertEquals(
      fileProtocolifyLocalImports(`import abc, {def, type ghi} from './mod.${ext}';`, url),
      `import abc, {def, type ghi} from 'file:///D:/a/b/mod.${ext}';`,
    );
  }
});
