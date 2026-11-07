# Nookara embeds

`embed.js` adds Nookara profiles, activity and account connections to any website as custom elements.
One script, no build step, no dependencies.

```html
<script defer src="https://nookara.cc/embed.js"></script>
<velora-card account="Ikelene"></velora-card>
```

To let visitors connect their Nookara account, register an app (My Account > Apps) and pass its id:

```html
<script defer src="https://nookara.cc/embed.js" data-app="app_..."></script>
```

The full element reference with live previews is at https://nookara.cc/embed.
Private profiles and network restrictions still apply to everything an embed shows.

## Files

| Path | What |
|---|---|
| `embed.js` | the script served at `nookara.cc/embed.js` |
| `src/bio-markdown.js` | the safe profile-bio renderer, shared with Nookara's own profile pages |
| `scripts/build-bio-embed.cjs` | copies the renderer into `embed.js` between the `GENERATED BIO RENDERER` markers |
| `examples/basic.html` | a minimal page |

After changing `src/bio-markdown.js`, run `node scripts/build-bio-embed.cjs`, or `--check` to just verify it's in sync.

## License

MIT, see [LICENSE](LICENSE).
