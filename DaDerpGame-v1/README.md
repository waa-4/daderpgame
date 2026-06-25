# DaDerpGame v1

A private-room multiplayer cube hangout for GitHub Pages.

## Included
- Supabase Realtime rooms with six-character codes
- Up to 8 players
- WASD, arrows, and mobile joystick
- Synced cube movement, names, and colors
- Shared drawing zone with brush controls
- Undo your own latest stroke
- Host-only clear drawing
- Preset speech bubbles
- Speed, bounce, random-color, and launch pads
- Kickable balls
- Local two-tab mode using BroadcastChannel

## Publish on GitHub Pages
1. Upload all files to a GitHub repository.
2. Open **Settings → Pages**.
3. Choose **Deploy from a branch**.
4. Select your branch and the root folder.
5. Open the generated Pages URL.

## Controls
Desktop: WASD/arrows to move, E to interact. Toggle Draw and drag inside the pink zone.

Mobile: left joystick to move, DRAW/MOVE to toggle drawing, USE to interact.

## Security note
`config.js` contains a browser-safe Supabase publishable key. Never add a secret key, service-role key, database password, or account password.

This is a friends-only relaxed multiplayer game. It is not an authoritative competitive server, so host-only controls are client-enforced.
