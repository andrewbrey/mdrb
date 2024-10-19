/* use `deno task deps` to bump deps */

import { $ as basic$, build$, CommandBuilder } from "@david/dax";
import { load as parseHTML } from "@esm.sh/cheerio";
import { parse as parseTOML } from "@std/toml";
import { tokens as parseMarkdown } from "@x/rusty_markdown";

export { colors } from "@cliffy/ansi/colors";
export { Command, EnumType, ValidationError } from "@cliffy/command";
export { type Extension, renderMarkdown } from "@littletof/charmd";
export { readAll } from "@std/io";
export { SEPARATOR as SEP } from "@std/path";
export { SEPARATOR as POSIX_SEP } from "@std/path/posix";
export { DefaultTheme } from "@x/hue/theme";
export { default as Typescript } from "@x/hue/typescript";
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
