# Markdown Run Book (_mdrb_)

[![deno doc](https://doc.deno.land/badge.svg)](https://doc.deno.land/https/deno.land/x/mdrb)

Execute a markdown file with Deno.

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
# a tty is required for interactive prompts
cat demo.md | mdrb --mode isolated
```

#### Prior Art

- https://github.com/c4spar/deno-dzx
- https://github.com/google/zx
- https://github.com/jacobdeichert/mask
