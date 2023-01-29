FROM ghcr.io/charmbracelet/vhs:v0.2.0

ARG MDRB_HASH

RUN [ -z "$MDRB_HASH" ] && echo "MDRB_HASH is required" && exit 1 || true

ENV PATH="$PATH:/root/.deno/bin"

RUN echo 'export PATH="$PATH:/root/.deno/bin"' >> ~/.bashrc

RUN apt install curl unzip bat -y \
  && curl -fsSL https://deno.land/x/install/install.sh | sh

ADD . /vhs/

RUN deno install -Arfn mdrb /vhs/mod.ts

RUN deno cache --lock=/vhs/deno.lock /vhs/deps.ts /vhs/deps.dev.ts

RUN mdrb /vhs/demo.md --mode isolated

ENTRYPOINT [] # override parent layer

CMD [ "/usr/bin/vhs" ]