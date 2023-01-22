import { $ } from "../deps.ts";

/** Enforce that a condition is true, and narrow types based on the assertion */
export function invariant(
  // deno-lint-ignore no-explicit-any
  condition: any,
  message = "invariant failed",
  // deno-lint-ignore no-explicit-any
  Err: new (...args: any[]) => Error = Error,
): asserts condition {
  if (condition) return;

  throw new Err(message);
}

/** Enforce that a path is an absolute file-protocol resolved relative to Deno.cwd if necessary */
export function toFileURL(path: string) {
  const noProtocol = path
    .replace(/^https:\/\//, "")
    .replace(/^http:\/\//, "")
    .replace(/^file:\/\//, "");

  const absolute = $.path.isAbsolute(noProtocol)
    ? noProtocol
    : $.path.join(Deno.cwd().replaceAll($.path.SEP, $.path.posix.sep), noProtocol);

  return $.path.toFileUrl(absolute).toString();
}
