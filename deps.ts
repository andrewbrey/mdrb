/* use `deno task deps` to bump deps */

import { parse as parseTOML } from "https://deno.land/std@0.220.1/toml/mod.ts";
import { $ as basic$, build$, CommandBuilder } from "https://deno.land/x/dax@0.39.2/mod.ts";
import { tokens as parseMarkdown } from "https://deno.land/x/rusty_markdown@v0.4.1/mod.ts";
import { load as parseHTML } from "https://esm.sh/cheerio@1.0.0-rc.12";

export { readAll } from "https://deno.land/std@0.220.1/io/mod.ts";
export { SEPARATOR as SEP } from "https://deno.land/std@0.220.1/path/mod.ts";
export { SEPARATOR as POSIX_SEP } from "https://deno.land/std@0.220.1/path/posix/mod.ts";
export { type Extension, renderMarkdown } from "https://deno.land/x/charmd@v0.0.2/mod.ts";
export { colors } from "https://deno.land/x/cliffy@v1.0.0-rc.3/ansi/mod.ts";
export { Command, EnumType, ValidationError } from "https://deno.land/x/cliffy@v1.0.0-rc.3/command/mod.ts";
export { default as Typescript } from "https://deno.land/x/hue@0.0.0-alpha.1/languages/typescript/typescript.ts";
export { DefaultTheme } from "https://deno.land/x/hue@0.0.0-alpha.1/themes/mod.ts";
export { CommandBuilder };

export const $ = build$({
	extras: {
		parseHTML,
		parseMarkdown,
		parseTOML,
		/** Compute a path relative to a specified `import.meta.url` */
		relativePath(importMetaURL: string, ...segments: string[]) {
			return basic$.path(importMetaURL).parentOrThrow().join(...segments).toString();
		},
	},
});
