FROM ghcr.io/charmbracelet/vhs:v0.2.0

ARG MDRB_VERSION

RUN [ -z "$MDRB_VERSION" ] && echo "MDRB_VERSION is required" && exit 1 || true

ENV PATH="$PATH:/root/.deno/bin"

RUN echo 'export PATH="$PATH:/root/.deno/bin"' >> ~/.bashrc

RUN apt install curl unzip bat -y \
  && curl -fsSL https://deno.land/x/install/install.sh | sh

RUN deno install -Arfn mdrb https://deno.land/x/mdrb@${MDRB_VERSION}/mod.ts

ADD deno.lock deps.ts deps.dev.ts /tmp/

RUN deno cache --lock=/tmp/deno.lock /tmp/deps.ts /tmp/deps.dev.ts

RUN mdrb https://deno.land/x/mdrb@${MDRB_VERSION}/demo.md --mode isolated

ENTRYPOINT [] # override parent layer

CMD [ "/usr/bin/vhs" ]