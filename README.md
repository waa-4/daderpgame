# DaDerpGame 3D v0.2

This version removes the database dependency from joining.

## Important
You do **not** need to run SQL just to join anymore.

Rooms, chat, movement, and blocks use Supabase Realtime Broadcast + Presence directly.

## Features
- Any room code auto-creates/joins
- Up to 10 active players per room
- Realtime movement
- Realtime chat
- Colored blocks
- 1x1, 2x2, 3x3 sizes
- Collision for self toggle
- Collision for others toggle
- Cannot place blocks overlapping players
- Right-click your own blocks to remove them

## Tradeoff
Because this version is realtime-only, blocks and chat are not permanently saved after everyone leaves the room. That can be added later once the core multiplayer is stable.

## GitHub Pages
Upload this folder directly to a repository and enable GitHub Pages.
