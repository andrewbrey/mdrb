FROM ghcr.io/charmbracelet/vhs:v0.8.1-devel

ARG MDRB_HASH

RUN [ -z "$MDRB_HASH" ] && echo "MDRB_HASH is required" && exit 1 || true

ENV PATH="$PATH:/root/.deno/bin"

RUN echo 'export PATH="$PATH:/root/.deno/bin"' >> ~/.bashrc

RUN apt install curl unzip bat -y \
  && curl -fsSL https://deno.land/x/install/install.sh | sh

ADD . /vhs/

RUN deno install --global --config=/vhs/deno.jsonc -Arfn mdrb /vhs/src/cli.ts

RUN deno cache --lock=/vhs/deno.lock /vhs/src/deps.ts /vhs/src/deps.dev.ts

RUN mdrb /vhs/demo.md --mode isolated
