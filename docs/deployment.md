# Cloudflare Pages

Project: `arqdeck-website`.
Production URL: https://arqdeck-website.pages.dev
Git source: `vientuliba/arqdeck-website`, production branch `main`.

Build settings:

- Framework preset: none.
- Build command: `npm run build`.
- Output directory: `dist`.
- Root directory: `.`.
- Node version: 22, selected by `.nvmrc`.

The existing Cloudflare Pages project is connected to GitHub and deploys production commits to main automatically. Its build settings were updated with the cf CLI to publish the generated release rather than the repository root.

The build copies only the homepage, browser bundle, stylesheet, required motion runtime, error page, response headers and any actual release files. Documentation, tests, package manifests, translation source files, original photographs and private/local files are not copied. A top-level 404.html disables the default SPA fallback for unknown paths. public/_headers supplies response security headers.

Image URLs in the production HTML come from the verified public R2 manifest. The Pages build does not need Cloudflare credentials, R2 tokens or a bucket binding; uploads happen separately with the authenticated cf CLI. Do not add deployment credentials to this repository.

To reproduce the project build settings:

```bash
cf pages edit arqdeck-website --build-config-build-command 'npm run build' --build-config-destination-dir dist --build-config-root-dir . --dry-run
```

Inspect the preview, then run the same command without `--dry-run`. No Wrangler configuration is required for this static Pages project.
