# Markdown Run Book (_mdrb_)

[![deno badge](https://img.shields.io/badge/deno.land/x/mdrb-success?logo=deno&logoColor=black&labelColor=white&color=black)](https://deno.land/x/mdrb)
[![ci](https://github.com/andrewbrey/mdrb/workflows/ci/badge.svg)](https://github.com/andrewbrey/mdrb/actions)

<img src=".github/logo.png" height="150px" alt="mdrb logo which consists of underlined text spelling out a period followed by the letters m, d, r, and b">

> _Turn your Markdown documentation into executable runbooks._

---

## Install

```sh
deno install --unstable -Arfn mdrb https://deno.land/x/mdrb/mod.ts
```

### Demo

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

#### Prior Art

- https://github.com/c4spar/deno-dzx
- https://github.com/google/zx
- https://github.com/jacobdeichert/mask
