import { assertEquals, assertStringIncludes, deadline } from "./deps.dev.ts";
import { $ } from "./deps.ts";

const mod = $.relativePath(import.meta.url, "mod.ts");
const demo = $.relativePath(import.meta.url, "demo.md");
const demoText = Deno.readTextFileSync(demo);

Deno.test("mdrb works with stdin", async () => {
  const { combined } = await $`deno run -A --unstable ${mod}`
    .stdinText(demoText).captureCombined();

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

Deno.test("mdrb shows error output stdin if no text piped", async () => {
  const { combined, code } = await $`deno run -A --unstable ${mod}`.stdinText("")
    .captureCombined().noThrow();

  assertEquals(code, 1);
  assertStringIncludes($.stripAnsi(combined), "no code to run from stdin");
});

Deno.test(
  "mdrb switches to 'isolated' mode from 'rubook' mode with stdin and does not wait for step confirmation",
  async () => {
    const timeout = 2_000;

    await deadline(
      $`deno run -A --unstable ${mod} --mode runbook`.stdinText(demoText).captureCombined().spawn(),
      timeout,
    );
  },
);
