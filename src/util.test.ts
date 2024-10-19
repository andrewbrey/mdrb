import { assertEquals, assertInstanceOf, assertThrows } from "./deps.dev.ts";
import { $, POSIX_SEP, SEP } from "./deps.ts";
import { invariant, toFileURL } from "./util.ts";

Deno.test("invariant throws if condition false", () => {
	assertThrows(() => invariant(Math.random() > 1));
});

Deno.test("invariant throws specific error types", () => {
	class TestError extends Error {
		constructor(msg: string) {
			super(msg);
		}
	}

	try {
		invariant(Math.random() > 1, "some message", TestError);
	} catch (error) {
		assertInstanceOf(error, TestError);
	}
});

Deno.test("invariant returns if all ok", () => {
	invariant(Math.random() < 2);
});

Deno.test("toFileURL works", () => {
	const toPosix = (path: string) => path.replaceAll(SEP, POSIX_SEP);
	const cwd = toPosix(Deno.cwd());

	if (Deno.build.os !== "windows") {
		assertEquals(toFileURL("/a/b/c"), "file:///a/b/c");
		assertEquals(toFileURL("./d/e/f"), `file://${cwd}/d/e/f`);
		assertEquals(toFileURL("../d/e/f"), `file://${toPosix($.path(cwd).join("..").toString())}/d/e/f`);
		assertEquals(toFileURL("file://./abc.ts"), `file://${cwd}/abc.ts`);
		assertEquals(toFileURL("http://./def.ts"), `file://${cwd}/def.ts`);
		assertEquals(toFileURL("https://./ghi.ts"), `file://${cwd}/ghi.ts`);
	} else {
		assertEquals(toFileURL("/a/b/c"), "file:///D:/a/b/c");
		assertEquals(toFileURL("./d/e/f"), `file:///${cwd}/d/e/f`);
		assertEquals(toFileURL("../d/e/f"), `file:///${toPosix($.path(cwd).join("..").toString())}/d/e/f`);
		assertEquals(toFileURL("file://./abc.ts"), `file:///${cwd}/abc.ts`);
		assertEquals(toFileURL("http://./def.ts"), `file:///${cwd}/def.ts`);
		assertEquals(toFileURL("https://./ghi.ts"), `file:///${cwd}/ghi.ts`);
	}
});
