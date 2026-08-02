# DaDerpGame

Static Three.js multiplayer sandbox for GitHub Pages.

## Controls
- WASD: move
- Space: jump
- Shift + left-drag or middle-drag: orbit camera
- Mouse wheel: camera distance
- Left click: place block
- Right click: remove one of your blocks

## Multiplayer
Rooms use Supabase Realtime Broadcast and Presence. Enter any non-empty room code to join that channel.

No database tables are required for this version. Blocks and chat exist while players are connected and are not permanently stored.

Upload the contents of this folder to GitHub and enable GitHub Pages.
