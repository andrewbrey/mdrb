import { parse as parseTOML } from "https://deno.land/std@0.175.0/encoding/toml.ts";
import { $ as basic$, build$, CommandBuilder } from "https://deno.land/x/dax@0.24.1/mod.ts";
import { tokens as parseMarkdown } from "https://deno.land/x/rusty_markdown@v0.4.1/mod.ts";
import { load as parseHTML } from "https://esm.sh/cheerio@1.0.0-rc.12";

export { readAll } from "https://deno.land/std@0.175.0/streams/mod.ts";
export { colors } from "https://deno.land/x/cliffy@v0.25.7/ansi/mod.ts";
export { Command, EnumType, ValidationError } from "https://deno.land/x/cliffy@v0.25.7/command/mod.ts";
export { CommandBuilder };

export const $ = build$({
	extras: {
		/** Get the dirname for a specified `import.meta.url` */
		dirname(importMetaURL: string) {
			return basic$.path.dirname(basic$.path.fromFileUrl(importMetaURL));
		},
		parseHTML,
		parseMarkdown,
		parseTOML,
		/** Compute a path relative to a specified `import.meta.url` */
		relativePath(importMetaURL: string, ...segments: string[]) {
			return basic$.path.join(this.dirname(importMetaURL), ...segments);
		},
	},
});
