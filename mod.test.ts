import { assertEquals, assertRejects, assertStringIncludes, serve } from "./deps.dev.ts";
import { $, CommandBuilder } from "./deps.ts";

const mod = $.relativePath(import.meta.url, "mod.ts");
const demo = $.relativePath(import.meta.url, "demo.md");
const demoText = Deno.readTextFileSync(demo);

const t$ = $.build$({
  commandBuilder: new CommandBuilder().captureCombined(true)
    .noThrow(true).env({ NO_COLOR: "true" }).timeout(10_000),
});

// Adapted from https://github.com/dsherret/dax/blob/77c2e708d1c14e4afc657f0affa38a450ff35607/src/request.test.ts#L5
function withServer(action: (serverUrl: URL) => Promise<void>) {
  const controller = new AbortController();
  const signal = controller.signal;
  return new Promise<void>((resolve, reject) => {
    serve((request) => {
      const url = new URL(request.url);
      if (url.pathname === "/demo") {
        return new Response(demoText, { status: 200 });
      } else {
        return new Response("", { status: 404 });
      }
    }, {
      hostname: "localhost",
      signal,
      async onListen(details) {
        const url = new URL(`http://${details.hostname}:${details.port}/`);
        try {
          await action(url);
          resolve();
          controller.abort();
        } catch (err) {
          reject(err);
          controller.abort();
        }
      },
    });
  });
}

Deno.test("mdrb works with local file", async () => {
  const { combined } = await t$`deno run -A --unstable ${mod} ${demo}`.stdinText("");

  const expected = $.dedent`
    step: 1 of 3
    Hello MDRB!
    step: 2 of 3
    Hello (again) MDRB!
    step: 3 of 3
    heeeeey! this will be printed to stderr :)
  `;

  assertEquals(combined.trim(), expected.trim());
});

Deno.test("mdrb shows error output for local file if no file exists", async () => {
  const { combined, code } = await t$`deno run -A --unstable ${mod} ./does-not-exist.md`.stdinText("");

  assertEquals(code, 1);
  assertStringIncludes(combined, "no file exists at ./does-not-exist.md");
});

Deno.test("mdrb shows error output for local file if text read", async () => {
  const file = await Deno.makeTempFile({ prefix: "mdrb-test_", suffix: ".md" });

  const { combined, code } = await t$`deno run -A --unstable ${mod} ${file}`.stdinText("");

  assertEquals(code, 1);
  assertStringIncludes(combined, `no code to run for ${file}`);
});

Deno.test("mdrb works with http", async () => {
  await withServer(async (serverURL) => {
    const url = new URL("/demo", serverURL);

    const { combined } = await t$`deno run -A --unstable ${mod} ${url}`.stdinText("");

    const expected = $.dedent`
      step: 1 of 3
      Hello MDRB!
      step: 2 of 3
      Hello (again) MDRB!
      step: 3 of 3
      heeeeey! this will be printed to stderr :)
    `;

    assertEquals(combined.trim(), expected.trim());
  });
});

Deno.test("mdrb shows error output for http if no text served", async () => {
  await withServer(async (serverURL) => {
    const url = new URL("/does-not-exist", serverURL);

    const { combined, code } = await t$`deno run -A --unstable ${mod} ${url}`.stdinText("");

    assertEquals(code, 1);
    assertStringIncludes(combined, "no code to run for http://localhost");
  });
});

Deno.test("mdrb works with stdin", async () => {
  const { combined } = await t$`deno run -A --unstable ${mod}`.stdinText(demoText);

  const expected = $.dedent`
    step: 1 of 3
    Hello MDRB!
    step: 2 of 3
    Hello (again) MDRB!
    step: 3 of 3
    heeeeey! this will be printed to stderr :)
  `;

  assertEquals(combined.trim(), expected.trim());
});

Deno.test("mdrb shows error output for stdin if no text piped", async () => {
  const { combined, code } = await t$`deno run -A --unstable ${mod}`.stdinText("");

  assertEquals(code, 1);
  assertStringIncludes(combined, "no code to run from stdin");
});

Deno.test(
  "mdrb switches to 'isolated' mode from 'rubook' mode for stdin and does not wait for step confirmation",
  async () => {
    const timeout = 2_000;

    await t$`deno run -A --unstable ${mod} --mode runbook`.stdinText(demoText)
      .timeout(timeout).noThrow(false);
  },
);

Deno.test("$ is defined by default", async () => {
  const md = $.dedent`
    ~~~ts
    console.log("$ is", typeof $);
    ~~~
  `;

  const { combined } = await t$`deno run -A --unstable ${mod}`
    .stdinText(md);

  assertStringIncludes(combined, "$ is function");
});

Deno.test("$ is undefined if dax integration disabled", async () => {
  const md = $.dedent`
    ~~~ts
    console.log("$ is", typeof $);
    ~~~
  `;

  const { combined } = await t$`deno run -A --unstable ${mod} --dax=false`
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

    await t$`deno run -A --unstable ${mod} --mode=single`.stdinText(md).noThrow(false);
  });
});
