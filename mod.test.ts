import { assertEquals } from "./deps.test.ts";
import { $ } from "./deps.ts";

const mod = $.relativePath(import.meta.url, "mod.ts");
const demo = $.relativePath(import.meta.url, "demo.md");
const demoText = Deno.readTextFileSync(demo);

Deno.test("mdrb works with stdin", async () => {
  const { combined, stdout, stderr } = await $`deno run -A --unstable ${mod} ${demo}`
    .stdinText(demoText).captureCombined().noThrow();

  // TODO: remove debug logs
  console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
  console.log("mod", mod);
  console.log("demo", demo);
  console.log("demoText", demoText);
  console.log("stdout", stdout);
  console.log("stderr", stderr);
  console.log("combined", combined);
  console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");

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
