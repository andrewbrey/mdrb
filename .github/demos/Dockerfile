FROM ghcr.io/charmbracelet/vhs:v0.2.0

ENV PATH="$PATH:/root/.deno/bin"

RUN echo 'export PATH="$PATH:/root/.deno/bin"' >> ~/.bashrc

RUN apt install curl unzip bat -y \
  && curl -fsSL https://deno.land/x/install/install.sh | sh \
  && deno install --unstable -Arfn mdrb https://deno.land/x/mdrb/mod.ts

ENTRYPOINT [] # override parent layer

CMD [ "/usr/bin/vhs" ]