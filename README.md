# DaDerpGame v8.2 — 3D Building

## Removed

- The floating 3D camera guide has been removed so it no longer blocks gameplay.

## New game: 3D Building

A simple 3D sandbox where players can:

- Place blocks
- Remove blocks
- Choose block colors
- Choose small, medium, or large block sizes
- Save a build locally
- Load a saved build
- Clear the whole build
- Synchronize builds with other players in the room

## Controls

- Use the 3D Building panel to switch between Place and Remove mode.
- Click or tap the world to place blocks.
- In Remove mode, click or tap near a block to remove it.
- Blocks snap to a clean grid.

## New file

- `building-3d.js`

The build system is separate from the main renderer so it can grow later without making the core script much larger.
