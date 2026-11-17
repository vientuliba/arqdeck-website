# Asset storage

Bucket: `arqdeck-downloads`.

The public endpoint in `r2-assets.json` was already enabled before this upload. No bucket permissions, custom domains or unrelated objects were changed. The existing r2.dev endpoint is intended for development; configure a production custom domain when the website domain is selected, update `publicBaseUrl`, and rerun the uploader.

The uploader selects image paths referenced by index.html and share.jpg. It writes versioned objects below `website/`, with a SHA-256 prefix in each filename. After each upload it checks the public HTTP response, MIME type and full SHA-256 digest. It writes the manifest only after every upload verifies. Repeated uploads of unchanged files reuse the same keys; modified files receive new keys. It does not delete old versions or other bucket data.

The production build checks the recorded digest against each local asset and uses the public URL in image sources, responsive image sources, favicon and sharing metadata. Source index.html keeps local paths for development and direct-file previews. `--local-assets` also keeps local references in a production build.

No installer was present locally or in the bucket when inspected. No software executable or artificial download was created. A future genuine release can be uploaded separately and connected through softwareRelease.url in app.js.
