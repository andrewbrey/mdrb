<h1 align="center">
  <br>
    <img src=".github/logo.png" height="150px" alt="mdrb logo which consists of underlined text spelling out a period followed by the letters m, d, r, and b">
  <br>
  Markdown Run Book
  <br>
  <br>
</h1>

<p align="center">Turn your Markdown documentation into executable runbooks.</p>

<p align="center">
  <a href="https://github.com/andrewbrey/mdrb/actions/workflows/ci.yml">
    <img src="https://github.com/andrewbrey/mdrb/workflows/ci/badge.svg" alt="github actions status badge">
  </a>
  <a href="https://deno.land/x/mdrb">
    <img src="https://img.shields.io/badge/deno.land/x/mdrb-success?logo=deno&logoColor=black&labelColor=white&color=black" alt="deno third-party module badge">
  </a>
</p>

---

## Installation

```sh
deno install -Arfn mdrb https://deno.land/x/mdrb/mod.ts
```

> Note: if you prefer not to bake `--allow-all` permissions (with the `-A` flag) into the installed command, you can
> specify alternate permissions, e.g. `deno install --allow-net -rfn mdrb https://deno.land/x/mdrb/mod.ts` but be aware
> that this means you will be prompted for permissions at runtime.

## Demo

```sh
# execute the mdrb demo from its url
mdrb https://deno.land/x/mdrb/demo.md

# or, if you cloned this repository
mdrb demo.md

# you can also pipe the file to `mdrb` but
# note that you can't use `runbook`
# mode (the default) when doing so because
# a tty is required for interactive prompts;
# mode will be changed to `isolated` for
# you in this scenario unless you manually
# specify a mode other than `runbook`
cat demo.md | mdrb --mode isolated
```

## Prior Art

- https://github.com/jacobdeichert/mask
- https://github.com/c4spar/deno-dzx
- https://github.com/google/zx

## License

[MIT](./LICENSE). Copyright (c) [Andrew Brey](https://andrewbrey.com)
