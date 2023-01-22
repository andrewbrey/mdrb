# MDRB Demo

This is a sample markdown file which contains several types of content, including:

- Fenced code blocks tagged with a supported language code, i.e.
  - `typescript`
  - `javascript`
  - `ts` $ `js`
- Inline code (like in the previous list)
- blockquotes
- lists
- headings
- and more!

> Hey look, a blockquote just before our first code block!

```typescript
// I can have comments

const message = "Hello MDRB!";
console.log(message);
```

## Second section

We can also have `code blocks` which are for unsupported languages, like this one for shell script

```sh
echo "I am not going to be run by mdrb, but I don't mind"
```

### Third level heading

Here we have a second fenced code block tagged with a supported language.

```js
const message = "Hello (again) MDRB!";
console.log(message);
```

Notice that these two code blocks each declare a `const` called `message` - this is ok, because by default, `mdrb` runs
your fenced `ts / js` code blocks as if they were isolated and separate script files.

If you want, you can change the mode to run them all together as a single script, but just FYI, if you do that for
_this_ file, it'll error because you can't redeclare a `const` :)

---

Another cool thing about `mdrb` is that by default, the [dax](https://deno.land/x/dax) _cross platform shell scripting
tools_ are injected into your script...basically by adding an import to the top of it that you don't have to write
yourself. Something like:

```
import { $ } from 'https://deno.land/x/dax@<version>/mod.ts
```

which means your fenced code blocks have access to a _magic_ `$` variable that is the default `$` export of the `dax`
module - super handy!

```ts
$.log("heeeeey! this will be printed to stderr :)");

const html = await $.request("https://example.com").text();

console.log(html);
```

## That's it for the quick demo

There's more to try with `mdrb`, so make sure to read the docs and try it out yourself! Enjoy!
