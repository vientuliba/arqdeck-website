# ArqDeck

A bilingual Latvian/English product website for ArqDeck modular desktop controllers. Static HTML and CSS with a small JavaScript bundle. No backend, authentication or checkout. Latvian is the default; the header switches the whole page to English. An explicit `?lang=en` URL opens English.

## Development

Requires Node.js 22 or later.

```bash
npm ci
npm run dev
```

The development server runs at http://localhost:5173 and watches JavaScript sources. Set `PORT` to use another port. You can also open the source `index.html` directly: the committed `site.js` supports language switching, purchase/software notices and mobile navigation through `file://`. Direct-file previews use local photographs and static visual fallbacks; served pages load the original motion modules.

- `npm run build:client` regenerates `site.js` from `app.js`, `i18n.js` and `translations.js`.
- `npm run build` creates `dist/` with public R2 image URLs.
- `npm run build -- --local-assets` creates a self-contained release with local images.
- `npm run preview` serves `dist/`.
- `npm start` rebuilds the browser bundle and serves the source directory.

## Assets and Cloudflare R2

Required product images, logo variants used by the page, and the sharing image are uploaded to the existing `arqdeck-downloads` bucket. `r2-assets.json` records each public URL, object key, SHA-256 hash, content type and size. The production build verifies local hashes before replacing image references; modified images must be uploaded again.

```bash
cf auth whoami
npm run assets:upload -- --dry-run
npm run assets:upload
npm run build
```

Use the **cf CLI** for Cloudflare operations. Credentials stay in the CLI's account configuration, outside this repository. Uploads use content-hashed object keys under `website/`, verify public responses byte for byte, and leave unrelated bucket objects untouched. The bucket currently uses its already-enabled `r2.dev` endpoint; no custom domain is configured. See [storage details](docs/storage.md).

The supplied photographs and authoritative [product reference](assets/product-reference.md) remain in `assets/`. Only the runtime files used by the page are retained from the design kit. Browser profiles, screenshots, build output, dependencies and local environment files are excluded from Git.

## Cloudflare Pages

The existing GitHub-connected project uses `npm run build` and output directory `dist`. Node 22 is selected by `.nvmrc`. Pushing main triggers a production deployment. Only the built release is published; repository source, references, tests and documentation stay outside the output. See [deployment details](docs/deployment.md).

## Content and functionality

- `index.html`: Latvian content and semantic page structure.
- `translations.js`: paired LV/EN text, including metadata, accessibility labels and notices.
- `i18n.js`: language switching. Choice is not stored; the normal URL starts in Latvian on reload.
- `app.js`: isolated purchase placeholders, public software download configuration and navigation bootstrap.
- `style.css`: website styles and language control.

Both purchase buttons announce availability without navigation or transactions. Replace `purchasePlaceholder()` when a purchasing system is ready.

No software installer has been supplied. When the authentic file is available, upload it and set `softwareRelease.url` to its public URL in `app.js`, optionally adding accurate filename/information, then rebuild. The download is independent of purchasing and accounts. The current button announces its upcoming availability.

## Verification

```bash
CHROME_PATH=/path/to/chromium npm run test:file
CHROME_PATH=/path/to/chromium node tests/file-browser.mjs dist/index.html
```

The file-protocol test uses real browser pointer and keyboard events. For served-page checks, open `/tests/browser.html` or `/tests/browser.html?build` on the source development server. The harness covers language round trips, metadata, accessibility descriptions, notices, navigation and mobile overflow.

See [validation](docs/validation.md), [design](docs/design.md) and [asset provenance](docs/asset-audit.md).

## Publication material

No installer, authentic software screenshots, usable team portraits or white-enclosure photographs were supplied. The page uses verified names and roles, genuine black-enclosure photographs and the supplied background-extracted hero. The existing Cloudflare Pages project publishes the production build at https://arqdeck-website.pages.dev. See [deployment configuration](docs/deployment.md).
