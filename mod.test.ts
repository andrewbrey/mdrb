import { assertEquals } from "./deps.dev.ts";
import { $ } from "./deps.ts";

const mod = $.relativePath(import.meta.url, "mod.ts");
const demo = $.relativePath(import.meta.url, "demo.md");
const demoText = Deno.readTextFileSync(demo);

Deno.test("mdrb works with stdin", async () => {
  const { combined } = await $`deno run -A --unstable ${mod} ${demo}`
    .stdinText(demoText).captureCombined().noThrow();

  const expected = $.dedent`
    step: 1 of 3
    Hello MDRB!
    step: 2 of 3
    Hello (again) MDRB!
    step: 3 of 3
    heeeeey! this will be printed to stderr :)
  `;

  assertEquals($.stripAnsi(combined).trim(), $.stripAnsi(expected).trim());
});
