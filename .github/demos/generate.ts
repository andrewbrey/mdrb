import { $ } from "../../deps.ts";

const root = $.relativePath(import.meta.url, "..", "..");
const latestTag = await $`git describe --tags --abbrev=0`.cwd(root).text();
const img = "mdrb-demos:latest";
const demosDir = $.path.join(".github", "demos");
const dockerfile = $.path.join(demosDir, "Dockerfile");

await $`docker build --build-arg MDRB_VERSION=${latestTag} -t ${img} -f ${dockerfile} .`
	.cwd(root);

for await (
	const tape of $.fs.expandGlob($.path.joinGlobs([demosDir, "*.tape"]))
) {
	await $`docker run --rm -v ${root}:/vhs ${img} vhs ${demosDir}/${tape.name}`
		.cwd(root);
}

const me = Deno.env.get("USER");
await $`sudo chown -R ${me}:${me} ${demosDir}`;
