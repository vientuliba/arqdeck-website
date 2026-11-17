# Validation

Repository preparation verified:

- All ten R2 assets were uploaded through the cf CLI. Each public GET response matched the local SHA-256 digest and MIME type. The bucket inventory matched every manifest key and size (450,201 bytes total). Existing unrelated objects were left intact.
- A clean npm ci and the production build passed. The production HTML uses R2 image URLs, including responsive sources, favicon and sharing metadata. The source HTML retains local assets for direct-file previews.
- Real Chromium file-protocol pointer and keyboard tests passed against both source index.html and the R2-backed dist/index.html: language switching, Enter, purchase/software notices, no transaction/navigation, mobile menu/Escape, and mobile overflow.
- The fourteen retained runtime kit files match their original bytes. Unused kit files, local screenshots, browser profiles and historical test artifacts were archived outside the repository.
- Credential-pattern scan and staged whitespace checks passed. Dependencies, build output, browser caches, screenshots and environment files are ignored.

Previous work also verified LV/EN text and attribute round trips, metadata, dynamic status messages, 320px controls, default Latvian and explicit English URLs. Desktop and mobile screenshots were reviewed, and performance checks had no failures. These historical artifacts are retained locally rather than committed.

The current cleanup does not add checkout, authentication or a software installer. No installer, usable team portraits or white-enclosure photos were supplied. The bucket has an existing public r2.dev endpoint and no custom domain. The final website hosting/canonical domain has not been configured or deployed in this task.
