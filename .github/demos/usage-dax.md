# What can `$` do?

<details data-mdrb>
<summary>make an http request and do stuff with results</summary>
</details>

```ts
const html = await $.request("https://example.com").text();

$.log("example.com is", html.length, "characters");
```

<details data-mdrb>
<summary>prompt the user</summary>
</details>

```ts
const fruits = ["apples", "bananas", "oranges"];
const faves = await $.multiSelect({ message: "favorite fruits?", options: fruits })
	.then((chosen) => chosen.map((idx) => fruits.at(idx)));

$.log("your faves are:", faves);
```

<details data-mdrb>
<summary>run shell commands</summary>
</details>

```ts
const thisDir = $.path.dirname($.path.fromFileUrl(import.meta.url));
await $`ls ${thisDir}`.printCommand(true);
```
