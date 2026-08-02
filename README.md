# DaDerpGame v0.4

This build fixes the Join button startup issue by using pinned browser-global builds of Three.js and Supabase instead of ES modules.

When the page loads, the join box should say `Ready.`

If it instead says:
- `Three.js did not load.` — the Three.js CDN failed.
- `Supabase library did not load.` — the Supabase CDN failed.

Enter a name and any non-empty room code, then press Join Room.

No SQL setup is required for this realtime-only build.
