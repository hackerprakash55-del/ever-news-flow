# Project rules

- Parse RSS and Atom with the pinned server-compatible XML parser in the feed function; never rely on browser DOM globals in Edge functions.
- Keep paid translation authenticated; public translation requires bounded, pretranslated published content rather than anonymous arbitrary-text generation.
- Publish Hindi variants only from trusted India feed refreshes using a database lease, content-hash queue, 20-story bound, and persisted provider pauses; public clients read existing text-hash variants without invoking generation.
- The existing five-minute news job authenticates using a protected database-held refresh secret; never treat the public anon bearer as a trusted publishing caller.