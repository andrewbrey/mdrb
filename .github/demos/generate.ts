import { expandGlob, joinGlobs } from "../../deps.dev.ts";
import { $ } from "../../deps.ts";

const root = $.relativePath(import.meta.url, "..", "..");
const latestHash = await $`git rev-parse HEAD`.cwd(root).text();
const img = "mdrb-demos:latest";
const demosDir = $.path(".github").join("demos");
const dockerfile = $.path(demosDir).join("Dockerfile");

await $`docker build --build-arg MDRB_HASH=${latestHash} -t ${img} -f ${dockerfile} .`.cwd(root);

const demos = [];
for await (const tape of expandGlob(joinGlobs([demosDir.toString(), "**", "vhs.tape"]))) {
	const mount = $.path(tape.path).dirname();
	demos.push($`docker run --rm -v ${mount}:/vhs/demos ${img} vhs /vhs/demos/vhs.tape`.cwd(root));
}

await Promise.all(demos);

const me = Deno.env.get("USER");
await $`sudo chown -R ${me}:${me} ${demosDir}`;
