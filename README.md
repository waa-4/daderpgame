# DaDerpGame 3D

Simple GitHub Pages multiplayer sandbox using Three.js + Supabase.

## Features
- Any room code auto-creates/joins a room
- Up to 10 active players
- Realtime movement and chat
- Colored 1x1, 2x2, or 3x3 blocks
- Separate collision toggles for the owner and other players
- Cannot place a block overlapping a player
- Right-click your own blocks to delete them
- WASD + Space
- Shift+drag or middle-drag to orbit, wheel to zoom

## Setup
1. Open your Supabase project.
2. Run `SUPABASE_SETUP.sql` once in SQL Editor.
3. Upload this folder to GitHub.
4. Enable GitHub Pages.

The publishable key you provided is already in `app.js`. Do not put a service-role key in a public site.
